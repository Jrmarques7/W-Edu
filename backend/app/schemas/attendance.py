from datetime import datetime
from pydantic import BaseModel


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    session_id: int | None
    recorded_at: datetime

    model_config = {"from_attributes": True}
