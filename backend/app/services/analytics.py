from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course
from app.models.document import Document
from app.models.enrollment import Enrollment
from app.models.finance import Charge, ChargeStatus, Subscription, SubscriptionStatus
from app.models.lesson import Lesson
from app.models.progress import Progress, ProgressStatus
from app.models.quiz import Quiz, QuizAttempt
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering, ScheduledMeeting, WaitlistEntry
from app.models.student import Organization, Student, UserRole
from app.schemas.analytics import (
    AnalyticsOverviewOut,
    AttendanceReportRowOut,
    ClassAnalyticsOut,
    ClassPerformanceReportRowOut,
    CompletionReportRowOut,
    CourseAnalyticsOut,
    EngagementReportRowOut,
    RoiReportRowOut,
    StudentAnalyticsOut,
)


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def overview(self, current: Student) -> AnalyticsOverviewOut:
        organization_id = current.organization_id if current.role == UserRole.company_manager else None
        return AnalyticsOverviewOut(
            total_students=self._count_students(organization_id),
            total_instructors=self._count_role(UserRole.instructor, organization_id),
            total_organizations=self._count_organizations(organization_id),
            total_courses=self._count_courses(organization_id),
            total_classes=self._count_classes(organization_id),
            total_meetings=self._count_meetings(organization_id),
            closed_meetings=self._count_meetings(organization_id, closed=True),
            certificates_issued=self._count_certificates(organization_id),
            active_subscriptions=self._count_active_subscriptions(organization_id),
            pending_charges_cents=self._sum_charges(organization_id, ChargeStatus.pending),
            paid_charges_cents=self._sum_charges(organization_id, ChargeStatus.paid),
            document_count=self._count_documents(organization_id),
            attendance_rate=self._attendance_rate(organization_id),
            completion_rate=self._completion_rate(organization_id),
            engagement_rate=self._engagement_rate(organization_id),
        )

    def courses(self, current: Student) -> list[CourseAnalyticsOut]:
        organization_id = current.organization_id if current.role == UserRole.company_manager else None
        query = self.db.query(Course).order_by(Course.name)
        if organization_id is not None:
            query = query.join(Enrollment, Enrollment.course_id == Course.id).join(
                Student,
                Student.id == Enrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return [self.course(course.id, current) for course in query.all()]

    def completion_report(self, current: Student) -> list[CompletionReportRowOut]:
        organization_id = self._organization_scope(current)
        rows: list[CompletionReportRowOut] = []
        for course in self._courses_for_scope(organization_id):
            enrolled = self._enrollment_count_for_course(course.id, organization_id)
            completed = self._certificate_count_for_course(course.id, organization_id)
            rows.append(
                CompletionReportRowOut(
                    scope_type="course",
                    scope_id=course.id,
                    course_id=course.id,
                    course_name=course.name,
                    enrolled=enrolled,
                    completed=completed,
                    completion_rate=self._rate(completed, enrolled),
                )
            )

        for class_offering in self._classes_for_scope(organization_id):
            course = class_offering.course or self.db.get(Course, class_offering.course_id)
            student_ids = self._student_ids_for_class(class_offering.id, organization_id)
            completed = self._certificate_count_for_students(class_offering.course_id, student_ids)
            rows.append(
                CompletionReportRowOut(
                    scope_type="class",
                    scope_id=class_offering.id,
                    course_id=class_offering.course_id,
                    course_name=course.name if course else f"Curso #{class_offering.course_id}",
                    class_name=class_offering.name,
                    enrolled=len(student_ids),
                    completed=completed,
                    completion_rate=self._rate(completed, len(student_ids)),
                )
            )
        return rows

    def attendance_report(self, current: Student) -> list[AttendanceReportRowOut]:
        organization_id = self._organization_scope(current)
        rows: list[AttendanceReportRowOut] = []
        for class_offering in self._classes_for_scope(organization_id):
            course = class_offering.course or self.db.get(Course, class_offering.course_id)
            meeting_ids = self._meeting_ids_for_class(class_offering.id)
            records = self._attendance_records_for_class(class_offering.id, organization_id)
            present = sum(1 for record in records if record.status == AttendanceStatus.present)
            late = sum(1 for record in records if record.status == AttendanceStatus.late)
            absent = sum(1 for record in records if record.status == AttendanceStatus.absent)
            rows.append(
                AttendanceReportRowOut(
                    class_offering_id=class_offering.id,
                    class_name=class_offering.name,
                    course_id=class_offering.course_id,
                    course_name=course.name if course else f"Curso #{class_offering.course_id}",
                    meetings=len(meeting_ids),
                    closed_meetings=self.db.query(ScheduledMeeting)
                    .filter(ScheduledMeeting.class_offering_id == class_offering.id, ScheduledMeeting.is_closed.is_(True))
                    .count(),
                    present=present,
                    late=late,
                    absent=absent,
                    attendance_rate=self._rate(present + late, present + late + absent),
                )
            )
        return rows

    def engagement_report(self, current: Student) -> list[EngagementReportRowOut]:
        organization_id = self._organization_scope(current)
        rows: list[EngagementReportRowOut] = []
        for course in self._courses_for_scope(organization_id):
            lesson_ids = [row[0] for row in self.db.query(Lesson.id).filter(Lesson.course_id == course.id).all()]
            progress_query = self.db.query(Progress).filter(Progress.lesson_id.in_(lesson_ids or [-1]))
            completed_query = progress_query.filter(Progress.status == ProgressStatus.done)
            quiz_ids = [
                row[0]
                for row in self.db.query(Quiz.id)
                .join(Lesson, Quiz.lesson_id == Lesson.id)
                .filter(Lesson.course_id == course.id)
                .all()
            ]
            quiz_query = self.db.query(QuizAttempt).filter(QuizAttempt.quiz_id.in_(quiz_ids or [-1]))
            passed_query = quiz_query.filter(QuizAttempt.passed.is_(True))
            if organization_id is not None:
                progress_query = progress_query.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
                completed_query = completed_query.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
                quiz_query = quiz_query.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == organization_id)
                passed_query = passed_query.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == organization_id)
            progress_records = progress_query.count()
            completed_progress_records = completed_query.count()
            quiz_attempts = quiz_query.count()
            passed_quiz_attempts = passed_query.count()
            rows.append(
                EngagementReportRowOut(
                    course_id=course.id,
                    course_name=course.name,
                    progress_records=progress_records,
                    completed_progress_records=completed_progress_records,
                    engagement_rate=self._rate(completed_progress_records, progress_records),
                    quiz_attempts=quiz_attempts,
                    passed_quiz_attempts=passed_quiz_attempts,
                    quiz_pass_rate=self._rate(passed_quiz_attempts, quiz_attempts),
                )
            )
        return rows

    def performance_report(self, current: Student) -> list[ClassPerformanceReportRowOut]:
        organization_id = self._organization_scope(current)
        rows: list[ClassPerformanceReportRowOut] = []
        for class_offering in self._classes_for_scope(organization_id):
            course = class_offering.course or self.db.get(Course, class_offering.course_id)
            student_ids = self._student_ids_for_class(class_offering.id, organization_id)
            completed = self._certificate_count_for_students(class_offering.course_id, student_ids)
            rows.append(
                ClassPerformanceReportRowOut(
                    class_offering_id=class_offering.id,
                    class_name=class_offering.name,
                    course_id=class_offering.course_id,
                    course_name=course.name if course else f"Curso #{class_offering.course_id}",
                    enrolled=len(student_ids),
                    completion_rate=self._rate(completed, len(student_ids)),
                    attendance_rate=self._attendance_rate_for_meetings(self._meeting_ids_for_class(class_offering.id), organization_id),
                    average_best_quiz_score=self._average_best_quiz_score(class_offering.course_id, organization_id, student_ids),
                )
            )
        return rows

    def roi_report(self, current: Student) -> list[RoiReportRowOut]:
        organization_id = self._organization_scope(current)
        organizations = self._organizations_for_scope(organization_id)
        rows: list[RoiReportRowOut] = []
        for organization in organizations:
            scoped_organization_id = organization.id if organization else None
            certificates_issued = self._count_certificates(scoped_organization_id)
            paid_charges_cents = self._sum_charges(scoped_organization_id, ChargeStatus.paid)
            rows.append(
                RoiReportRowOut(
                    organization_id=scoped_organization_id,
                    organization_name=organization.name if organization else "Sem empresa",
                    students=self._count_students(scoped_organization_id),
                    paid_charges_cents=paid_charges_cents,
                    pending_charges_cents=self._sum_charges(scoped_organization_id, ChargeStatus.pending),
                    certificates_issued=certificates_issued,
                    completion_rate=self._completion_rate(scoped_organization_id),
                    revenue_per_certificate_cents=round(paid_charges_cents / certificates_issued) if certificates_issued else 0,
                )
            )
        return rows

    def course(self, course_id: int, current: Student | None = None) -> CourseAnalyticsOut:
        course = self.db.get(Course, course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        organization_id = self._organization_scope(current)
        if organization_id is not None and not self._course_has_organization(course_id, organization_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")

        enrollments_query = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        if organization_id is not None:
            enrollments_query = enrollments_query.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
        enrollments = enrollments_query.count()
        class_offering_ids = self._class_ids_for_course(course_id, organization_id)
        meeting_ids = [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id.in_(class_offering_ids or [-1])).all()]
        closed_meetings = self.db.query(ScheduledMeeting).filter(
            ScheduledMeeting.class_offering_id.in_(class_offering_ids or [-1]),
            ScheduledMeeting.is_closed.is_(True),
        ).count()
        certificates_query = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            certificates_query = certificates_query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        certificates_issued = certificates_query.count()
        attendance_rate = self._attendance_rate_for_meetings(meeting_ids, organization_id)
        completion_rate = self._completion_rate_for_course(course_id, organization_id)
        average_best_quiz_score = self._average_best_quiz_score(course_id, organization_id)
        pending_charges_cents = self._sum_course_charges(course_id, ChargeStatus.pending, organization_id)
        paid_charges_cents = self._sum_course_charges(course_id, ChargeStatus.paid, organization_id)
        return CourseAnalyticsOut(
            course_id=course.id,
            course_name=course.name,
            modality=course.modality.value,
            enrollments=enrollments,
            class_offerings=len(class_offering_ids),
            meetings=len(meeting_ids),
            closed_meetings=closed_meetings,
            certificates_issued=certificates_issued,
            attendance_rate=attendance_rate,
            completion_rate=completion_rate,
            average_best_quiz_score=average_best_quiz_score,
            pending_charges_cents=pending_charges_cents,
            paid_charges_cents=paid_charges_cents,
        )

    def student_me(self, current: Student) -> StudentAnalyticsOut:
        return self.student(current.id)

    def student(self, student_id: int, current: Student | None = None) -> StudentAnalyticsOut:
        student = self.db.get(Student, student_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        organization_id = self._organization_scope(current)
        if organization_id is not None and student.organization_id != organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        enrollments = self.db.query(Enrollment).filter(Enrollment.student_id == student_id).count()
        completed_courses = self.db.query(Certificate).filter(Certificate.student_id == student_id, Certificate.revoked_at.is_(None)).count()
        attendance_rate = self._attendance_rate_for_student(student_id)
        progress_rate = self._progress_rate_for_student(student_id)
        quiz_rate = self._quiz_rate_for_student(student_id)
        documents_count = self.db.query(Document).filter(Document.student_id == student_id).count()
        active_subscriptions = self.db.query(Subscription).filter(
            Subscription.student_id == student_id,
            Subscription.status == SubscriptionStatus.active,
        ).count()
        return StudentAnalyticsOut(
            student_id=student.id,
            student_name=student.name,
            enrollments=enrollments,
            completed_courses=completed_courses,
            certificates_issued=completed_courses,
            attendance_rate=attendance_rate,
            progress_rate=progress_rate,
            quiz_rate=quiz_rate,
            documents_count=documents_count,
            active_subscriptions=active_subscriptions,
        )

    def class_(self, class_id: int, current: Student | None = None) -> ClassAnalyticsOut:
        class_offering = self.db.get(ClassOffering, class_id)
        if not class_offering:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
        organization_id = self._organization_scope(current)
        if organization_id is not None and not self._class_has_organization(class_id, organization_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
        course = self.db.get(Course, class_offering.course_id)
        enrolled_query = self.db.query(ClassEnrollment).filter(
            ClassEnrollment.class_offering_id == class_id,
            ClassEnrollment.status == ClassEnrollmentStatus.active,
        )
        if organization_id is not None:
            enrolled_query = enrolled_query.join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id)
        total_enrolled = enrolled_query.count()
        meetings = self.db.query(ScheduledMeeting).filter(ScheduledMeeting.class_offering_id == class_id).count()
        closed_meetings = self.db.query(ScheduledMeeting).filter(
            ScheduledMeeting.class_offering_id == class_id,
            ScheduledMeeting.is_closed.is_(True),
        ).count()
        records_query = self.db.query(AttendanceRecord).filter(AttendanceRecord.class_offering_id == class_id)
        if organization_id is not None:
            records_query = records_query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        records = records_query.all()
        present = sum(1 for record in records if record.status == AttendanceStatus.present)
        late = sum(1 for record in records if record.status == AttendanceStatus.late)
        absent = sum(1 for record in records if record.status == AttendanceStatus.absent)
        attendance_rate = self._attendance_rate_for_meetings(
            [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id == class_id).all()],
            organization_id,
        )
        waitlist_query = self.db.query(WaitlistEntry).filter(WaitlistEntry.class_offering_id == class_id)
        if organization_id is not None:
            waitlist_query = waitlist_query.join(Student, Student.id == WaitlistEntry.student_id).filter(Student.organization_id == organization_id)
        waitlist_count = waitlist_query.count()
        certificates_query = self.db.query(Certificate).filter(Certificate.course_id == class_offering.course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            certificates_query = certificates_query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        certificates_issued = certificates_query.count()
        return ClassAnalyticsOut(
            class_offering_id=class_id,
            class_name=class_offering.name,
            course_id=class_offering.course_id,
            course_name=course.name if course else f"Curso #{class_offering.course_id}",
            total_enrolled=total_enrolled,
            meetings=meetings,
            closed_meetings=closed_meetings,
            present=present,
            late=late,
            absent=absent,
            attendance_rate=attendance_rate,
            waitlist_count=waitlist_count,
            certificates_issued=certificates_issued,
        )

    def _count_students(self, organization_id: int | None) -> int:
        query = self.db.query(Student)
        if organization_id is not None:
            query = query.filter(Student.organization_id == organization_id)
        return query.count()

    def _count_role(self, role: UserRole, organization_id: int | None) -> int:
        query = self.db.query(Student).filter(Student.role == role)
        if organization_id is not None:
            query = query.filter(Student.organization_id == organization_id)
        return query.count()

    def _count_organizations(self, organization_id: int | None) -> int:
        if organization_id is None:
            return self.db.query(Organization).count()
        return 1

    def _count_courses(self, organization_id: int | None) -> int:
        query = self.db.query(Course)
        if organization_id is not None:
            query = query.join(Enrollment, Enrollment.course_id == Course.id).join(
                Student,
                Student.id == Enrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return query.count()

    def _count_classes(self, organization_id: int | None) -> int:
        query = self.db.query(ClassOffering)
        if organization_id is not None:
            query = query.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(
                Student,
                Student.id == ClassEnrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return query.count()

    def _count_meetings(self, organization_id: int | None, closed: bool | None = None) -> int:
        query = self.db.query(ScheduledMeeting)
        if organization_id is not None:
            query = query.join(ClassOffering, ClassOffering.id == ScheduledMeeting.class_offering_id).join(
                ClassEnrollment,
                ClassEnrollment.class_offering_id == ClassOffering.id,
            ).join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id)
            query = query.distinct()
        if closed is not None:
            query = query.filter(ScheduledMeeting.is_closed.is_(closed))
        return query.count()

    def _count_certificates(self, organization_id: int | None) -> int:
        query = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            query = query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return query.count()

    def _count_active_subscriptions(self, organization_id: int | None) -> int:
        query = self.db.query(Subscription).filter(Subscription.status == SubscriptionStatus.active)
        if organization_id is not None:
            query = query.filter(Subscription.organization_id == organization_id)
        return query.count()

    def _count_documents(self, organization_id: int | None) -> int:
        query = self.db.query(Document)
        if organization_id is not None:
            query = query.filter(Document.organization_id == organization_id)
        return query.count()

    def _attendance_rate(self, organization_id: int | None) -> int:
        meeting_ids = [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.is_closed.is_(True)).all()]
        if not meeting_ids:
            return 0
        total_query = self.db.query(AttendanceRecord).filter(AttendanceRecord.scheduled_meeting_id.in_(meeting_ids))
        attended_query = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.scheduled_meeting_id.in_(meeting_ids),
            AttendanceRecord.status.in_([AttendanceStatus.present, AttendanceStatus.late]),
        )
        if organization_id is not None:
            total_query = total_query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
            attended_query = attended_query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        total = total_query.count()
        if total == 0:
            return 0
        attended = attended_query.count()
        return round(attended / total * 100)

    def _completion_rate(self, organization_id: int | None) -> int:
        total_query = self.db.query(Enrollment)
        completed_query = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            total_query = total_query.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
            completed_query = completed_query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        total = total_query.count()
        if total == 0:
            return 0
        completed = completed_query.count()
        return round(completed / total * 100)

    def _engagement_rate(self, organization_id: int | None) -> int:
        total_query = self.db.query(Progress)
        completed_query = self.db.query(Progress).filter(Progress.status == ProgressStatus.done)
        if organization_id is not None:
            total_query = total_query.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
            completed_query = completed_query.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
        total = total_query.count()
        if total == 0:
            return 0
        completed = completed_query.count()
        return round(completed / total * 100)

    def _attendance_rate_for_meetings(self, meeting_ids: list[int], organization_id: int | None = None) -> int:
        if not meeting_ids:
            return 0
        total_query = self.db.query(AttendanceRecord).filter(AttendanceRecord.scheduled_meeting_id.in_(meeting_ids))
        attended_query = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.scheduled_meeting_id.in_(meeting_ids),
            AttendanceRecord.status.in_([AttendanceStatus.present, AttendanceStatus.late]),
        )
        if organization_id is not None:
            total_query = total_query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
            attended_query = attended_query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        total = total_query.count()
        if total == 0:
            return 0
        attended = attended_query.count()
        return round(attended / total * 100)

    def _attendance_rate_for_student(self, student_id: int) -> int:
        total = self.db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).count()
        if total == 0:
            return 0
        attended = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.status.in_([AttendanceStatus.present, AttendanceStatus.late]),
        ).count()
        return round(attended / total * 100)

    def _progress_rate_for_student(self, student_id: int) -> int:
        total = self.db.query(Progress).filter(Progress.student_id == student_id).count()
        if total == 0:
            return 0
        completed = self.db.query(Progress).filter(Progress.student_id == student_id, Progress.status == ProgressStatus.done).count()
        return round(completed / total * 100)

    def _quiz_rate_for_student(self, student_id: int) -> int:
        attempts = self.db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).count()
        if attempts == 0:
            return 0
        passed = self.db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id, QuizAttempt.passed.is_(True)).count()
        return round(passed / attempts * 100)

    def _sum_charges(self, organization_id: int | None, status_value: ChargeStatus) -> int:
        query = self.db.query(func.coalesce(func.sum(Charge.amount_cents), 0)).filter(Charge.status == status_value)
        if organization_id is not None:
            query = query.filter(Charge.organization_id == organization_id)
        return query.scalar() or 0

    def _sum_course_charges(self, course_id: int, status_value: ChargeStatus, organization_id: int | None = None) -> int:
        query = self.db.query(func.coalesce(func.sum(Charge.amount_cents), 0)).filter(
            Charge.course_id == course_id,
            Charge.status == status_value,
        )
        if organization_id is not None:
            query = query.filter(Charge.organization_id == organization_id)
        return query.scalar() or 0

    def _average_best_quiz_score(self, course_id: int, organization_id: int | None = None, student_ids: list[int] | None = None) -> int:
        quiz_ids = [
            row[0]
            for row in self.db.query(Quiz.id)
            .join(Lesson, Quiz.lesson_id == Lesson.id)
            .filter(Lesson.course_id == course_id)
            .all()
        ]
        if not quiz_ids:
            return 0
        query = self.db.query(QuizAttempt.student_id, func.max(QuizAttempt.score)).filter(QuizAttempt.quiz_id.in_(quiz_ids))
        if student_ids is not None:
            if not student_ids:
                return 0
            query = query.filter(QuizAttempt.student_id.in_(student_ids))
        if organization_id is not None:
            query = query.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == organization_id)
        best_scores = query.group_by(QuizAttempt.student_id).all()
        if not best_scores:
            return 0
        return round(sum(score for _, score in best_scores) / len(best_scores))

    def _completion_rate_for_course(self, course_id: int, organization_id: int | None = None) -> int:
        total_query = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        completed_query = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            total_query = total_query.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
            completed_query = completed_query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        total = total_query.count()
        if total == 0:
            return 0
        completed = completed_query.count()
        return round(completed / total * 100)

    def _organization_scope(self, current: Student | None) -> int | None:
        if current and current.role == UserRole.company_manager:
            return current.organization_id
        return None

    def _course_has_organization(self, course_id: int, organization_id: int) -> bool:
        return (
            self.db.query(Enrollment)
            .join(Student, Student.id == Enrollment.student_id)
            .filter(Enrollment.course_id == course_id, Student.organization_id == organization_id)
            .first()
            is not None
        )

    def _class_has_organization(self, class_id: int, organization_id: int) -> bool:
        return (
            self.db.query(ClassEnrollment)
            .join(Student, Student.id == ClassEnrollment.student_id)
            .filter(ClassEnrollment.class_offering_id == class_id, Student.organization_id == organization_id)
            .first()
            is not None
        )

    def _class_ids_for_course(self, course_id: int, organization_id: int | None) -> list[int]:
        query = self.db.query(ClassOffering.id).filter(ClassOffering.course_id == course_id)
        if organization_id is not None:
            query = query.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(
                Student,
                Student.id == ClassEnrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return [row[0] for row in query.all()]

    def _rate(self, value: int, total: int) -> int:
        if total == 0:
            return 0
        return round(value / total * 100)

    def _courses_for_scope(self, organization_id: int | None) -> list[Course]:
        query = self.db.query(Course).order_by(Course.name)
        if organization_id is not None:
            query = query.join(Enrollment, Enrollment.course_id == Course.id).join(
                Student,
                Student.id == Enrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return query.all()

    def _classes_for_scope(self, organization_id: int | None) -> list[ClassOffering]:
        query = self.db.query(ClassOffering).order_by(ClassOffering.starts_at.desc())
        if organization_id is not None:
            query = query.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(
                Student,
                Student.id == ClassEnrollment.student_id,
            ).filter(Student.organization_id == organization_id)
            query = query.distinct()
        return query.all()

    def _organizations_for_scope(self, organization_id: int | None) -> list[Organization]:
        query = self.db.query(Organization).order_by(Organization.name)
        if organization_id is not None:
            query = query.filter(Organization.id == organization_id)
        return query.all()

    def _enrollment_count_for_course(self, course_id: int, organization_id: int | None) -> int:
        query = self.db.query(Enrollment).filter(Enrollment.course_id == course_id)
        if organization_id is not None:
            query = query.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
        return query.count()

    def _certificate_count_for_course(self, course_id: int, organization_id: int | None) -> int:
        query = self.db.query(Certificate).filter(Certificate.course_id == course_id, Certificate.revoked_at.is_(None))
        if organization_id is not None:
            query = query.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return query.count()

    def _certificate_count_for_students(self, course_id: int, student_ids: list[int]) -> int:
        if not student_ids:
            return 0
        return (
            self.db.query(Certificate)
            .filter(
                Certificate.course_id == course_id,
                Certificate.student_id.in_(student_ids),
                Certificate.revoked_at.is_(None),
            )
            .count()
        )

    def _student_ids_for_class(self, class_id: int, organization_id: int | None) -> list[int]:
        query = self.db.query(ClassEnrollment.student_id).filter(
            ClassEnrollment.class_offering_id == class_id,
            ClassEnrollment.status == ClassEnrollmentStatus.active,
        )
        if organization_id is not None:
            query = query.join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id)
        return [row[0] for row in query.all()]

    def _meeting_ids_for_class(self, class_id: int) -> list[int]:
        return [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.class_offering_id == class_id).all()]

    def _attendance_records_for_class(self, class_id: int, organization_id: int | None) -> list[AttendanceRecord]:
        query = self.db.query(AttendanceRecord).filter(AttendanceRecord.class_offering_id == class_id)
        if organization_id is not None:
            query = query.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        return query.all()
