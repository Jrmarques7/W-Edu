from datetime import datetime
from pydantic import BaseModel


class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int


class EnrollmentOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime

    model_config = {"from_attributes": True}
