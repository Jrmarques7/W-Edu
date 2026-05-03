from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.finance import Charge, ChargeStatus
from app.models.progress import Progress, ProgressStatus
from app.models.quiz import Quiz, QuizAttempt
from app.models.lesson import Lesson
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering, ScheduledMeeting
from app.models.student import Organization, Student
from app.schemas.analytics import AttendanceReportRowOut, CompletionReportRowOut, EngagementReportRowOut, ClassPerformanceReportRowOut, RoiReportRowOut
from sqlalchemy import func
from ._base import AnalyticsBase


class AnalyticsReportService(AnalyticsBase):
    def __init__(self, db: Session):
        super().__init__(db)

    def completion_report(self, current: Student) -> list[CompletionReportRowOut]:
        org_id = self._organization_scope(current)
        rows: list[CompletionReportRowOut] = []
        for course in self._courses_for_scope(org_id):
            enrolled = self._enrollment_count_for_course(course.id, org_id)
            completed = self._certificate_count_for_course(course.id, org_id)
            rows.append(CompletionReportRowOut(scope_type="course", scope_id=course.id, course_id=course.id, course_name=course.name, enrolled=enrolled, completed=completed, completion_rate=self._rate(completed, enrolled)))
        for cls in self._classes_for_scope(org_id):
            course = cls.course or self.db.get(Course, cls.course_id)
            student_ids = self._student_ids_for_class(cls.id, org_id)
            completed = self._certificate_count_for_students(cls.course_id, student_ids)
            rows.append(CompletionReportRowOut(scope_type="class", scope_id=cls.id, course_id=cls.course_id, course_name=course.name if course else f"Curso #{cls.course_id}", class_name=cls.name, enrolled=len(student_ids), completed=completed, completion_rate=self._rate(completed, len(student_ids))))
        return rows

    def attendance_report(self, current: Student) -> list[AttendanceReportRowOut]:
        org_id = self._organization_scope(current)
        rows: list[AttendanceReportRowOut] = []
        for cls in self._classes_for_scope(org_id):
            course = cls.course or self.db.get(Course, cls.course_id)
            records = self._attendance_records_for_class(cls.id, org_id)
            present = sum(1 for r in records if r.status == AttendanceStatus.present)
            late = sum(1 for r in records if r.status == AttendanceStatus.late)
            absent = sum(1 for r in records if r.status == AttendanceStatus.absent)
            closed = self.db.query(ScheduledMeeting).filter(ScheduledMeeting.class_offering_id == cls.id, ScheduledMeeting.is_closed.is_(True)).count()
            rows.append(AttendanceReportRowOut(class_offering_id=cls.id, class_name=cls.name, course_id=cls.course_id, course_name=course.name if course else f"Curso #{cls.course_id}", meetings=len(self._meeting_ids_for_class(cls.id)), closed_meetings=closed, present=present, late=late, absent=absent, attendance_rate=self._rate(present + late, present + late + absent)))
        return rows

    def engagement_report(self, current: Student) -> list[EngagementReportRowOut]:
        org_id = self._organization_scope(current)
        rows: list[EngagementReportRowOut] = []
        for course in self._courses_for_scope(org_id):
            lesson_ids = [row[0] for row in self.db.query(Lesson.id).filter(Lesson.course_id == course.id).all()]
            pq = self.db.query(Progress).filter(Progress.lesson_id.in_(lesson_ids or [-1]))
            cq = pq.filter(Progress.status == ProgressStatus.done)
            quiz_ids = [row[0] for row in self.db.query(Quiz.id).join(Lesson, Quiz.lesson_id == Lesson.id).filter(Lesson.course_id == course.id).all()]
            aq = self.db.query(QuizAttempt).filter(QuizAttempt.quiz_id.in_(quiz_ids or [-1]))
            passed_q = aq.filter(QuizAttempt.passed.is_(True))
            if org_id is not None:
                pq = pq.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == org_id)
                cq = cq.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == org_id)
                aq = aq.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == org_id)
                passed_q = passed_q.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == org_id)
            pr, cpr, qa, pa = pq.count(), cq.count(), aq.count(), passed_q.count()
            rows.append(EngagementReportRowOut(course_id=course.id, course_name=course.name, progress_records=pr, completed_progress_records=cpr, engagement_rate=self._rate(cpr, pr), quiz_attempts=qa, passed_quiz_attempts=pa, quiz_pass_rate=self._rate(pa, qa)))
        return rows

    def performance_report(self, current: Student) -> list[ClassPerformanceReportRowOut]:
        org_id = self._organization_scope(current)
        rows: list[ClassPerformanceReportRowOut] = []
        for cls in self._classes_for_scope(org_id):
            course = cls.course or self.db.get(Course, cls.course_id)
            student_ids = self._student_ids_for_class(cls.id, org_id)
            completed = self._certificate_count_for_students(cls.course_id, student_ids)
            rows.append(ClassPerformanceReportRowOut(class_offering_id=cls.id, class_name=cls.name, course_id=cls.course_id, course_name=course.name if course else f"Curso #{cls.course_id}", enrolled=len(student_ids), completion_rate=self._rate(completed, len(student_ids)), attendance_rate=self._attendance_rate_for_meetings(self._meeting_ids_for_class(cls.id), org_id), average_best_quiz_score=self._average_best_quiz_score(cls.course_id, org_id, student_ids)))
        return rows

    def roi_report(self, current: Student) -> list[RoiReportRowOut]:
        org_id = self._organization_scope(current)
        rows: list[RoiReportRowOut] = []
        for org in self._organizations_for_scope(org_id):
            scoped_id = org.id if org else None
            certs = self._count_certificates_for_org(scoped_id)
            paid = self._sum_charges_for_org(scoped_id, ChargeStatus.paid)
            rows.append(RoiReportRowOut(organization_id=scoped_id, organization_name=org.name if org else "Sem empresa", students=self._count_students_for_org(scoped_id), paid_charges_cents=paid, pending_charges_cents=self._sum_charges_for_org(scoped_id, ChargeStatus.pending), certificates_issued=certs, completion_rate=self._global_completion_rate_for_org(scoped_id), revenue_per_certificate_cents=round(paid / certs) if certs else 0))
        return rows

    def _courses_for_scope(self, organization_id: int | None) -> list[Course]:
        q = self.db.query(Course).order_by(Course.name)
        if organization_id is not None:
            q = q.join(Enrollment, Enrollment.course_id == Course.id).join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        return q.all()

    def _classes_for_scope(self, organization_id: int | None) -> list[ClassOffering]:
        q = self.db.query(ClassOffering).order_by(ClassOffering.starts_at.desc())
        if organization_id is not None:
            q = q.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        return q.all()

    def _organizations_for_scope(self, organization_id: int | None) -> list[Organization]:
        q = self.db.query(Organization).order_by(Organization.name)
        if organization_id is not None:
            q = q.filter(Organization.id == organization_id)
        return q.all()

    def _enrollment_count_for_course(self, course_id: int, organization_id: int | None) -> int:
        q = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        if organization_id is not None:
            q = q.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
        return q.count()

    def _certificate_count_for_course(self, course_id: int, organization_id: int | None) -> int:
        q = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            q = q.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return q.count()

    def _certificate_count_for_students(self, course_id: int, student_ids: list[int]) -> int:
        if not student_ids:
            return 0
        return self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.student_id.in_(student_ids), Certificate.revoked_at.is_(None)).count()

    def _student_ids_for_class(self, class_id: int, organization_id: int | None) -> list[int]:
        q = self.db.query(ClassEnrollment.student_id).filter(ClassEnrollment.class_offering_id == class_id, ClassEnrollment.status == ClassEnrollmentStatus.active)
        if organization_id is not None:
            q = q.join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id)
        return [row[0] for row in q.all()]

    def _meeting_ids_for_class(self, class_id: int) -> list[int]:
        return [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id == class_id).all()]

    def _attendance_records_for_class(self, class_id: int, organization_id: int | None) -> list[AttendanceRecord]:
        q = self.db.query(AttendanceRecord).filter(AttendanceRecord.class_offering_id == class_id)
        if organization_id is not None:
            q = q.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        return q.all()

    def _count_students_for_org(self, organization_id: int | None) -> int:
        q = self.db.query(Student)
        if organization_id is not None:
            q = q.filter(Student.organization_id == organization_id)
        return q.count()

    def _count_certificates_for_org(self, organization_id: int | None) -> int:
        q = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            q = q.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return q.count()

    def _sum_charges_for_org(self, organization_id: int | None, status_value: ChargeStatus) -> int:
        q = self.db.query(func.coalesce(func.sum(Charge.amount_cents), 0)).filter(Charge.status == status_value)
        if organization_id is not None:
            q = q.filter(Charge.organization_id == organization_id)
        return q.scalar() or 0

    def _global_completion_rate_for_org(self, organization_id: int | None) -> int:
        tq = self.db.query(Enrollment)
        cq = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            tq = tq.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
            cq = cq.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return self._rate(cq.count(), tq.count())
