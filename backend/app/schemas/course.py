from datetime import datetime
from pydantic import BaseModel


class CourseCreate(BaseModel):
    name: str
    description: str | None = None
    agent_id: str | None = None


class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    agent_id: str | None = None


class CourseOut(BaseModel):
    id: int
    name: str
    description: str | None
    agent_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
