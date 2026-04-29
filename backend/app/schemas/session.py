from datetime import datetime
from pydantic import BaseModel


class SessionCreate(BaseModel):
    lesson_id: int


class SessionOut(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    bevox_session_id: str | None
    transcript: str | None
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class BevoxWebhookPayload(BaseModel):
    bevox_session_id: str
    transcript: str | None = None
    ended_at: datetime | None = None
