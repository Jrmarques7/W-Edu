from datetime import datetime
from pydantic import BaseModel
from app.models.lesson import LessonType


class LessonCreate(BaseModel):
    course_id: int
    title: str
    content: str | None = None
    order: int = 0
    type: LessonType = LessonType.text


class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    order: int | None = None
    type: LessonType | None = None


class LessonOut(BaseModel):
    id: int
    course_id: int
    title: str
    content: str | None
    order: int
    type: LessonType
    created_at: datetime

    model_config = {"from_attributes": True}
