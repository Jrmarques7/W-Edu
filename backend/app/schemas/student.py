from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.student import UserRole


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student


class StudentUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
