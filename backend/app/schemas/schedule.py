from datetime import datetime
from pydantic import BaseModel, Field

from app.models.schedule import AttendanceMethod, AttendanceStatus, ClassEnrollmentStatus, ClassStatus, MeetingType, PracticalAssessmentStatus


class LocationCreate(BaseModel):
    name: str
    address: str | None = None


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    is_active: bool | None = None


class LocationOut(BaseModel):
    id: int
    name: str
    address: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RoomCreate(BaseModel):
    location_id: int
    name: str
    capacity: int = Field(gt=0)
    resources: str | None = None


class RoomUpdate(BaseModel):
    location_id: int | None = None
    name: str | None = None
    capacity: int | None = Field(default=None, gt=0)
    resources: str | None = None
    is_active: bool | None = None


class RoomOut(BaseModel):
    id: int
    location_id: int
    name: str
    capacity: int
    resources: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ClassOfferingCreate(BaseModel):
    course_id: int
    name: str
    starts_at: datetime
    ends_at: datetime
    capacity: int = Field(gt=0)
    status: ClassStatus = ClassStatus.draft
    location_id: int | None = None
    room_id: int | None = None
    instructor_id: int | None = None


class ClassOfferingUpdate(BaseModel):
    course_id: int | None = None
    name: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    capacity: int | None = Field(default=None, gt=0)
    status: ClassStatus | None = None
    location_id: int | None = None
    room_id: int | None = None
    instructor_id: int | None = None


class ClassOfferingOut(BaseModel):
    id: int
    course_id: int
    name: str
    starts_at: datetime
    ends_at: datetime
    capacity: int
    status: ClassStatus
    location_id: int | None
    room_id: int | None
    instructor_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClassEnrollmentOut(BaseModel):
    id: int
    class_offering_id: int
    student_id: int
    status: ClassEnrollmentStatus
    enrolled_at: datetime

    model_config = {"from_attributes": True}


class WaitlistEntryOut(BaseModel):
    id: int
    class_offering_id: int
    student_id: int
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ClassJoinOut(BaseModel):
    result: str
    enrollment: ClassEnrollmentOut | None = None
    waitlist_entry: WaitlistEntryOut | None = None


class ScheduledMeetingCreate(BaseModel):
    class_offering_id: int
    lesson_id: int | None = None
    room_id: int | None = None
    title: str
    starts_at: datetime
    ends_at: datetime
    type: MeetingType = MeetingType.in_person
    meeting_url: str | None = None


class ScheduledMeetingUpdate(BaseModel):
    lesson_id: int | None = None
    room_id: int | None = None
    title: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    type: MeetingType | None = None
    meeting_url: str | None = None


class ScheduledMeetingOut(BaseModel):
    id: int
    class_offering_id: int
    lesson_id: int | None
    room_id: int | None
    title: str
    starts_at: datetime
    ends_at: datetime
    type: MeetingType
    meeting_url: str | None
    is_closed: bool
    closed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CheckinTokenCreate(BaseModel):
    valid_minutes: int = Field(default=30, gt=0, le=1440)


class CheckinTokenOut(BaseModel):
    id: int
    scheduled_meeting_id: int
    token: str
    expires_at: datetime
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceRecordCreate(BaseModel):
    student_id: int
    status: AttendanceStatus = AttendanceStatus.present
    method: AttendanceMethod = AttendanceMethod.manual
    notes: str | None = None


class AttendanceRecordOut(BaseModel):
    id: int
    scheduled_meeting_id: int
    class_offering_id: int
    student_id: int
    status: AttendanceStatus
    method: AttendanceMethod
    recorded_at: datetime
    notes: str | None

    model_config = {"from_attributes": True}


class MeetingAttendanceSummary(BaseModel):
    meeting_id: int
    class_offering_id: int
    total_enrolled: int
    present: int
    late: int
    absent: int
    recorded: int


class MeetingAttendanceReportRow(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    status: AttendanceStatus
    method: AttendanceMethod | None = None
    recorded_at: datetime | None = None
    notes: str | None = None
    practical_score: int | None = None
    practical_status: PracticalAssessmentStatus | None = None
    practical_feedback: str | None = None
    practical_recorded_at: datetime | None = None


class PracticalAssessmentRecordCreate(BaseModel):
    student_id: int
    score: int = Field(ge=0, le=100)
    status: PracticalAssessmentStatus = PracticalAssessmentStatus.reviewed
    feedback: str | None = None


class PracticalAssessmentRecordOut(BaseModel):
    id: int
    scheduled_meeting_id: int
    class_offering_id: int
    student_id: int
    score: int
    status: PracticalAssessmentStatus
    feedback: str | None
    recorded_at: datetime
    recorded_by_id: int | None

    model_config = {"from_attributes": True}
