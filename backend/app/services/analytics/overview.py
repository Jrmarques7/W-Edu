from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course
from app.models.document import Document
from app.models.enrollment import Enrollment
from app.models.finance import Charge, ChargeStatus, Subscription, SubscriptionStatus
from app.models.progress import Progress, ProgressStatus
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassOffering, ScheduledMeeting
from app.models.student import Organization, Student, UserRole
from app.schemas.analytics import AnalyticsOverviewOut
from ._base import AnalyticsBase


class AnalyticsOverviewService(AnalyticsBase):
    def __init__(self, db: Session):
        super().__init__(db)

    def overview(self, current: Student) -> AnalyticsOverviewOut:
        org_id = self._organization_scope(current)
        return AnalyticsOverviewOut(
            total_students=self._count_students(org_id),
            total_instructors=self._count_role(UserRole.instructor, org_id),
            total_organizations=self._count_organizations(org_id),
            total_courses=self._count_courses(org_id),
            total_classes=self._count_classes(org_id),
            total_meetings=self._count_meetings(org_id),
            closed_meetings=self._count_meetings(org_id, closed=True),
            certificates_issued=self._count_certificates(org_id),
            active_subscriptions=self._count_active_subscriptions(org_id),
            pending_charges_cents=self._sum_charges(org_id, ChargeStatus.pending),
            paid_charges_cents=self._sum_charges(org_id, ChargeStatus.paid),
            document_count=self._count_documents(org_id),
            attendance_rate=self._global_attendance_rate(org_id),
            completion_rate=self._global_completion_rate(org_id),
            engagement_rate=self._global_engagement_rate(org_id),
        )

    def _count_students(self, organization_id: int | None) -> int:
        q = self.db.query(Student)
        if organization_id is not None:
            q = q.filter(Student.organization_id == organization_id)
        return q.count()

    def _count_role(self, role: UserRole, organization_id: int | None) -> int:
        q = self.db.query(Student).filter(Student.role == role)
        if organization_id is not None:
            q = q.filter(Student.organization_id == organization_id)
        return q.count()

    def _count_organizations(self, organization_id: int | None) -> int:
        if organization_id is None:
            return self.db.query(Organization).count()
        return 1

    def _count_courses(self, organization_id: int | None) -> int:
        q = self.db.query(Course)
        if organization_id is not None:
            q = q.join(Enrollment, Enrollment.course_id == Course.id).join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        return q.count()

    def _count_classes(self, organization_id: int | None) -> int:
        q = self.db.query(ClassOffering)
        if organization_id is not None:
            q = q.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        return q.count()

    def _count_meetings(self, organization_id: int | None, closed: bool | None = None) -> int:
        q = self.db.query(ScheduledMeeting)
        if organization_id is not None:
            q = q.join(ClassOffering, ClassOffering.id == ScheduledMeeting.class_offering_id).join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id).join(Student, Student.id == ClassEnrollment.student_id).filter(Student.organization_id == organization_id).distinct()
        if closed is not None:
            q = q.filter(ScheduledMeeting.is_closed.is_(closed))
        return q.count()

    def _count_certificates(self, organization_id: int | None) -> int:
        q = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            q = q.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return q.count()

    def _count_active_subscriptions(self, organization_id: int | None) -> int:
        q = self.db.query(Subscription).filter(Subscription.status == SubscriptionStatus.active)
        if organization_id is not None:
            q = q.filter(Subscription.organization_id == organization_id)
        return q.count()

    def _count_documents(self, organization_id: int | None) -> int:
        q = self.db.query(Document)
        if organization_id is not None:
            q = q.filter(Document.organization_id == organization_id)
        return q.count()

    def _sum_charges(self, organization_id: int | None, status_value: ChargeStatus) -> int:
        q = self.db.query(func.coalesce(func.sum(Charge.amount_cents), 0)).filter(Charge.status == status_value)
        if organization_id is not None:
            q = q.filter(Charge.organization_id == organization_id)
        return q.scalar() or 0

    def _global_attendance_rate(self, organization_id: int | None) -> int:
        meeting_ids = [row[0] for row in self.db.query(ScheduledMeeting.id).filter(ScheduledMeeting.is_closed.is_(True)).all()]
        return self._attendance_rate_for_meetings(meeting_ids, organization_id)

    def _global_completion_rate(self, organization_id: int | None) -> int:
        tq = self.db.query(Enrollment)
        cq = self.db.query(Certificate).filter(Certificate.revoked_at.is_(None))
        if organization_id is not None:
            tq = tq.join(Student, Student.id == Enrollment.student_id).filter(Student.organization_id == organization_id)
            cq = cq.join(Student, Student.id == Certificate.student_id).filter(Student.organization_id == organization_id)
        return self._rate(cq.count(), tq.count())

    def _global_engagement_rate(self, organization_id: int | None) -> int:
        tq = self.db.query(Progress)
        cq = self.db.query(Progress).filter(Progress.status == ProgressStatus.done)
        if organization_id is not None:
            tq = tq.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
            cq = cq.join(Student, Student.id == Progress.student_id).filter(Student.organization_id == organization_id)
        return self._rate(cq.count(), tq.count())
