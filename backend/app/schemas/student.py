from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.student import UserRole


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.student
    organization_id: int | None = None


class StudentUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    role: UserRole | None = None
    organization_id: int | None = None
    is_active: bool | None = None


class OrganizationCreate(BaseModel):
    name: str
    legal_name: str | None = None
    document: str | None = None
    contact_email: EmailStr | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    legal_name: str | None = None
    document: str | None = None
    contact_email: EmailStr | None = None
    is_active: bool | None = None


class OrganizationOut(BaseModel):
    id: int
    name: str
    legal_name: str | None
    document: str | None
    contact_email: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentProfileUpdate(BaseModel):
    phone: str | None = None
    document: str | None = None
    position: str | None = None
    department: str | None = None
    bio: str | None = None


class StudentProfileOut(BaseModel):
    id: int
    student_id: int
    phone: str | None
    document: str | None
    position: str | None
    department: str | None
    bio: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class InstructorProfileUpdate(BaseModel):
    specialties: str | None = None
    bio: str | None = None
    rating: str | None = None


class InstructorProfileOut(BaseModel):
    id: int
    student_id: int
    specialties: str | None
    bio: str | None
    rating: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StudentOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    organization_id: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
