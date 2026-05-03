from sqlalchemy.orm import Session

from app.models.student import Student
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

from .entities import EntityAnalyticsService
from .overview import AnalyticsOverviewService
from .reports import AnalyticsReportService


class AnalyticsService:
    def __init__(self, db: Session):
        self._overview = AnalyticsOverviewService(db)
        self._entities = EntityAnalyticsService(db)
        self._reports = AnalyticsReportService(db)

    def overview(self, current: Student) -> AnalyticsOverviewOut:
        return self._overview.overview(current)

    def courses(self, current: Student) -> list[CourseAnalyticsOut]:
        return self._entities.courses(current)

    def course(self, course_id: int, current: Student | None = None) -> CourseAnalyticsOut:
        return self._entities.course(course_id, current)

    def student_me(self, current: Student) -> StudentAnalyticsOut:
        return self._entities.student_me(current)

    def student(self, student_id: int, current: Student | None = None) -> StudentAnalyticsOut:
        return self._entities.student(student_id, current)

    def class_(self, class_id: int, current: Student | None = None) -> ClassAnalyticsOut:
        return self._entities.class_(class_id, current)

    def completion_report(self, current: Student) -> list[CompletionReportRowOut]:
        return self._reports.completion_report(current)

    def attendance_report(self, current: Student) -> list[AttendanceReportRowOut]:
        return self._reports.attendance_report(current)

    def engagement_report(self, current: Student) -> list[EngagementReportRowOut]:
        return self._reports.engagement_report(current)

    def performance_report(self, current: Student) -> list[ClassPerformanceReportRowOut]:
        return self._reports.performance_report(current)

    def roi_report(self, current: Student) -> list[RoiReportRowOut]:
        return self._reports.roi_report(current)
