from datetime import datetime
from pydantic import BaseModel


class AnalyticsOverviewOut(BaseModel):
    total_students: int
    total_instructors: int
    total_organizations: int
    total_courses: int
    total_classes: int
    total_meetings: int
    closed_meetings: int
    certificates_issued: int
    active_subscriptions: int
    pending_charges_cents: int
    paid_charges_cents: int
    document_count: int
    attendance_rate: int
    completion_rate: int
    engagement_rate: int


class CourseAnalyticsOut(BaseModel):
    course_id: int
    course_name: str
    modality: str
    enrollments: int
    class_offerings: int
    meetings: int
    closed_meetings: int
    certificates_issued: int
    attendance_rate: int
    completion_rate: int
    average_best_quiz_score: int
    pending_charges_cents: int
    paid_charges_cents: int


class StudentAnalyticsOut(BaseModel):
    student_id: int
    student_name: str
    enrollments: int
    completed_courses: int
    certificates_issued: int
    attendance_rate: int
    progress_rate: int
    quiz_rate: int
    documents_count: int
    active_subscriptions: int


class ClassAnalyticsOut(BaseModel):
    class_offering_id: int
    class_name: str
    course_id: int
    course_name: str
    total_enrolled: int
    meetings: int
    closed_meetings: int
    present: int
    late: int
    absent: int
    attendance_rate: int
    waitlist_count: int
    certificates_issued: int


class CompletionReportRowOut(BaseModel):
    scope_type: str
    scope_id: int
    course_id: int
    course_name: str
    class_name: str | None = None
    enrolled: int
    completed: int
    completion_rate: int


class AttendanceReportRowOut(BaseModel):
    class_offering_id: int
    class_name: str
    course_id: int
    course_name: str
    meetings: int
    closed_meetings: int
    present: int
    late: int
    absent: int
    attendance_rate: int


class EngagementReportRowOut(BaseModel):
    course_id: int
    course_name: str
    progress_records: int
    completed_progress_records: int
    engagement_rate: int
    quiz_attempts: int
    passed_quiz_attempts: int
    quiz_pass_rate: int


class ClassPerformanceReportRowOut(BaseModel):
    class_offering_id: int
    class_name: str
    course_id: int
    course_name: str
    enrolled: int
    completion_rate: int
    attendance_rate: int
    average_best_quiz_score: int


class RoiReportRowOut(BaseModel):
    organization_id: int | None
    organization_name: str
    students: int
    paid_charges_cents: int
    pending_charges_cents: int
    certificates_issued: int
    completion_rate: int
    revenue_per_certificate_cents: int


class AnalyticsCourseSummaryOut(BaseModel):
    generated_at: datetime
    overview: AnalyticsOverviewOut
    courses: list[CourseAnalyticsOut]
