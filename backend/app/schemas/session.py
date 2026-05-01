from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    lesson_id: int


class SessionVoiceUpdate(BaseModel):
    bevox_session_id: str | None = None
    transcript: str | None = None
    ended: bool = False


class SessionOut(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    bevox_session_id: str | None
    transcript: str | None
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class SessionHistoryOut(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    lesson_title: str
    course_id: int
    course_name: str
    bevox_session_id: str | None
    transcript: str | None
    has_transcript: bool
    duration_minutes: int | None
    started_at: datetime
    ended_at: datetime | None


class BevoxWebhookPayload(BaseModel):
    bevox_session_id: str
    transcript: str | None = None
    ended_at: datetime | None = None
