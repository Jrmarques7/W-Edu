from datetime import datetime
from pydantic import BaseModel, Field


class CertificateRuleUpdate(BaseModel):
    require_lessons_complete: bool | None = None
    minimum_progress_percent: int | None = Field(default=None, ge=0, le=100)
    require_quiz: bool | None = None
    minimum_quiz_score: int | None = Field(default=None, ge=0, le=100)
    require_attendance: bool | None = None
    minimum_attendance_percent: int | None = Field(default=None, ge=0, le=100)
    auto_issue: bool | None = None


class CertificateRuleOut(BaseModel):
    id: int
    course_id: int
    require_lessons_complete: bool
    minimum_progress_percent: int
    require_quiz: bool
    minimum_quiz_score: int
    require_attendance: bool
    minimum_attendance_percent: int
    auto_issue: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CertificateIssueOut(BaseModel):
    issued: bool
    certificate_id: int | None = None
    validation_code: str | None = None


class CertificateRevokeIn(BaseModel):
    reason: str | None = None


class CertificateOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    validation_code: str
    issued_by_id: int | None
    issued_at: datetime
    revoked_at: datetime | None
    revoked_reason: str | None
    pdf_url: str | None

    model_config = {"from_attributes": True}


class CertificateValidationOut(BaseModel):
    valid: bool
    certificate: CertificateOut | None = None
    message: str | None = None
    course_name: str | None = None
    student_name: str | None = None


class CertificateEligibilityOut(BaseModel):
    course_id: int
    student_id: int
    eligible: bool
    progress_percent: int
    quiz_percent: int
    attendance_percent: int
    reasons: list[str]
