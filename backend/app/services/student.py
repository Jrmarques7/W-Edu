from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.student import InstructorProfile, Organization, Student, StudentProfile, UserRole
from app.repositories.student import OrganizationRepository, ProfileRepository, StudentRepository
from app.schemas.student import (
    InstructorProfileUpdate,
    OrganizationCreate,
    OrganizationUpdate,
    StudentCreate,
    StudentProfileUpdate,
    StudentUpdate,
)


class StudentService:
    def __init__(self, db: Session):
        self.repo = StudentRepository(db)
        self.org_repo = OrganizationRepository(db)
        self.profile_repo = ProfileRepository(db)

    def create(self, data: StudentCreate) -> Student:
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
        if data.organization_id and not self.org_repo.get_by_id(data.organization_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
        student = Student(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=data.role,
            organization_id=data.organization_id,
        )
        student = self.repo.create(student)
        self.ensure_default_profile(student)
        return student

    def get_or_404(self, student_id: int) -> Student:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        return student

    def list_all(self) -> list[Student]:
        return self.repo.list_all()

    def update(self, student_id: int, data: StudentUpdate) -> Student:
        student = self.get_or_404(student_id)
        payload = data.model_dump(exclude_none=True)
        if "organization_id" in payload and payload["organization_id"] and not self.org_repo.get_by_id(payload["organization_id"]):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
        for field, value in payload.items():
            setattr(student, field, value)
        student = self.repo.update(student)
        self.ensure_default_profile(student)
        return student

    def delete(self, student_id: int) -> None:
        student = self.get_or_404(student_id)
        self.repo.delete(student)

    def ensure_default_profile(self, student: Student) -> None:
        if student.role == UserRole.student and not self.profile_repo.get_student_profile(student.id):
            self.profile_repo.create_student_profile(StudentProfile(student_id=student.id))
        if student.role == UserRole.instructor and not self.profile_repo.get_instructor_profile(student.id):
            self.profile_repo.create_instructor_profile(InstructorProfile(student_id=student.id))

    def update_student_profile(self, student_id: int, data: StudentProfileUpdate) -> StudentProfile:
        self.get_or_404(student_id)
        profile = self.profile_repo.get_student_profile(student_id)
        if not profile:
            profile = self.profile_repo.create_student_profile(StudentProfile(student_id=student_id))
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(profile, field, value)
        return self.profile_repo.update(profile)

    def update_instructor_profile(self, student_id: int, data: InstructorProfileUpdate) -> InstructorProfile:
        student = self.get_or_404(student_id)
        if student.role != UserRole.instructor:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuário não é instrutor")
        profile = self.profile_repo.get_instructor_profile(student_id)
        if not profile:
            profile = self.profile_repo.create_instructor_profile(InstructorProfile(student_id=student_id))
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(profile, field, value)
        return self.profile_repo.update(profile)


class OrganizationService:
    def __init__(self, db: Session):
        self.repo = OrganizationRepository(db)

    def create(self, data: OrganizationCreate) -> Organization:
        if self.repo.get_by_name(data.name):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Empresa já cadastrada")
        return self.repo.create(Organization(**data.model_dump()))

    def get_or_404(self, organization_id: int) -> Organization:
        organization = self.repo.get_by_id(organization_id)
        if not organization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Empresa não encontrada")
        return organization

    def list_all(self) -> list[Organization]:
        return self.repo.list_all()

    def update(self, organization_id: int, data: OrganizationUpdate) -> Organization:
        organization = self.get_or_404(organization_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(organization, field, value)
        return self.repo.update(organization)
