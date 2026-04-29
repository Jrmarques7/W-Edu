from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.progress import ProgressStatus


class ProgressUpdate(BaseModel):
    status: ProgressStatus


class ProgressOut(BaseModel):
    id: int
    student_id: int
    lesson_id: int
    status: ProgressStatus
    content_consumed_at: Optional[datetime]
    updated_at: datetime

    model_config = {"from_attributes": True}
