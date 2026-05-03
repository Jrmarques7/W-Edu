from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course
from app.models.document import Document
from app.models.enrollment import Enrollment
from app.models.finance import Subscription, SubscriptionStatus
from app.models.progress import Progress, ProgressStatus
from app.models.quiz import QuizAttempt
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering, ScheduledMeeting, WaitlistEntry
from app.models.student import Student, UserRole
from app.schemas.analytics import ClassAnalyticsOut, CourseAnalyticsOut, StudentAnalyticsOut
from app.models.finance import Charge, ChargeStatus
from sqlalchemy import func
from ._base import AnalyticsBase


class EntityAnalyticsService(AnalyticsBase):
    def __init__(self, db: Session):
        super().__init__(db)

    def courses(self, current: Student) -> list[CourseAnalyticsOut]:
        organization_id = current.organization_id if current.role == UserRole.company_manager else None
        query = self.db.query(Course).order_by(Course.name)
        if organization_id is not None:
            query = query.join(Enrollment, Enrollment.course_id == Course.id).join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        return [self.course(course.id, current) for course in query.all()]

    def course(self, course_id: int, current: Student | None = None) -> CourseAnalyticsOut:
        course = self.db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        org_id = self._organization_scope(current)
        if org_id is not None and not self._course_has_organization(course_id, org_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")

        enroll_q = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        if org_id is not None:
            enroll_q = enroll_q.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == org_id)
        class_ids = self._class_ids_for_course(course_id, org_id)
        meeting_ids = [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id.in_(class_ids or [-1])).all()]
        closed_meetings = self.db.query(ScheduledMeeting).filter(ScheduledMeeting.class_offering_id.in_(class_ids or [-1]), ScheduledMeeting.is_closed.is_(True)).count()
        cert_q = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if org_id is not None:
            cert_q = cert_q.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == org_id)

        return CourseAnalyticsOut(
            course_id=course.id, course_name=course.name, modality=course.modality.value,
            enrollments=enroll_q.count(), class_offerings=len(class_ids),
            meetings=len(meeting_ids), closed_meetings=closed_meetings,
            certificates_issued=cert_q.count(),
            attendance_rate=self._attendance_rate_for_meetings(meeting_ids, org_id),
            completion_rate=self._completion_rate_for_course(course_id, org_id),
            average_best_quiz_score=self._average_best_quiz_score(course_id, org_id),
            pending_charges_cents=self._sum_course_charges(course_id, ChargeStatus.pending, org_id),
            paid_charges_cents=self._sum_course_charges(course_id, ChargeStatus.paid, org_id),
        )

    def student_me(self, current: Student) -> StudentAnalyticsOut:
        return self.student(current.id)

    def student(self, student_id: int, current: Student | None = None) -> StudentAnalyticsOut:
        student = self.db.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        org_id = self._organization_scope(current)
        if org_id is not None and student.organization_id != org_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        completed = self.db.query(Certificate).filter(Certificate.student_id == student_id, Certificate.revoked_at.is_(None)).count()
        return StudentAnalyticsOut(
            student_id=student.id, student_name=student.name,
            enrollments=self.db.query(Enrollment).filter(Enrollment.student_id == student_id).count(),
            completed_courses=completed, certificates_issued=completed,
            attendance_rate=self._attendance_rate_for_student(student_id),
            progress_rate=self._progress_rate_for_student(student_id),
            quiz_rate=self._quiz_rate_for_student(student_id),
            documents_count=self.db.query(Document).filter(Document.student_id == student_id).count(),
            active_subscriptions=self.db.query(Subscription).filter(Subscription.student_id == student_id, Subscription.status == SubscriptionStatus.active).count(),
        )

    def class_(self, class_id: int, current: Student | None = None) -> ClassAnalyticsOut:
        class_offering = self.db.get(ClassOffering, class_id)
        if not class_offering:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
        org_id = self._organization_scope(current)
        if org_id is not None and not self._class_has_organization(class_id, org_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
        course = self.db.get(Course, class_offering.course_id)
        enroll_q = self.db.query(ClassEnrollment).filter(ClassEnrollment.class_offering_id == class_id, ClassEnrollment.status == ClassEnrollmentStatus.active)
        if org_id is not None:
            enroll_q = enroll_q.join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == org_id)
        records_q = self.db.query(AttendanceRecord).filter(AttendanceRecord.class_offering_id == class_id)
        if org_id is not None:
            records_q = records_q.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == org_id)
        records = records_q.all()
        meeting_ids = [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id == class_id).all()]
        waitlist_q = self.db.query(WaitlistEntry).filter(WaitlistEntry.class_offering_id == class_id)
        if org_id is not None:
            waitlist_q = waitlist_q.join(Student, Student.id == WaitlistEntry.student_id).filter(Student.organization_id == org_id)
        cert_q = self.db.query(Certificate).filter(Certificate.course_id == class_offering.course_id, Certificate.revoked_at.is_(None))
        if org_id is not None:
            cert_q = cert_q.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == org_id)
        return ClassAnalyticsOut(
            class_offering_id=class_id, class_name=class_offering.name,
            course_id=class_offering.course_id, course_name=course.name if course else f"Curso #{class_offering.course_id}",
            total_enrolled=enroll_q.count(),
            meetings=self.db.query(ScheduledMeeting).filter(ScheduledMeeting.class_offering_id == class_id).count(),
            closed_meetings=self.db.query(ScheduledMeeting).filter(ScheduledMeeting.class_offering_id == class_id, ScheduledMeeting.is_closed.is_(True)).count(),
            present=sum(1 for r in records if r.status == AttendanceStatus.present),
            late=sum(1 for r in records if r.status == AttendanceStatus.late),
            absent=sum(1 for r in records if r.status == AttendanceStatus.absent),
            attendance_rate=self._attendance_rate_for_meetings(meeting_ids, org_id),
            waitlist_count=waitlist_q.count(), certificates_issued=cert_q.count(),
        )

    def _attendance_rate_for_student(self, student_id: int) -> int:
        total = self.db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).count()
        if total == 0:
            return 0
        attended = self.db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id, AttendanceRecord.status.in_([AttendanceStatus.present, AttendanceStatus.late])).count()
        return self._rate(attended, total)

    def _progress_rate_for_student(self, student_id: int) -> int:
        total = self.db.query(Progress).filter(Progress.student_id == student_id).count()
        if total == 0:
            return 0
        done = self.db.query(Progress).filter(Progress.student_id == student_id, Progress.status == ProgressStatus.done).count()
        return self._rate(done, total)

    def _quiz_rate_for_student(self, student_id: int) -> int:
        attempts = self.db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).count()
        if attempts == 0:
            return 0
        passed = self.db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id, QuizAttempt.passed.is_(True)).count()
        return self._rate(passed, attempts)

    def _completion_rate_for_course(self, course_id: int, organization_id: int | None = None) -> int:
        tq = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        cq = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            tq = tq.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
            cq = cq.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return self._rate(cq.count(), tq.count())

    def _sum_course_charges(self, course_id: int, status_value: ChargeStatus, organization_id: int | None = None) -> int:
        q = self.db.query(func.coalesce(func.sum(Charge.amount_cents), 0)).filter(Charge.course_id == course_id, Charge.status == status_value)
        if organization_id is not None:
            q = q.filter(Charge.organization_id == organization_id)
        return q.scalar() or 0

    def _course_has_organization(self, course_id: int, organization_id: int) -> bool:
        return self.db.query(Enrollment).join(Student, Student.id == Enrollment.student_id).filter(Enrollment.course_id == course_id, Student.organization_id == organization_id).first() is not None

    def _class_has_organization(self, class_id: int, organization_id: int) -> bool:
        return self.db.query(ClassEnrollment).join(Student, Student.id == ClassEnrollment.student_id).filter(ClassEnrollment.class_offering_id == class_id, Student.organization_id == organization_id).first() is not None
