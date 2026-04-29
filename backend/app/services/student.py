from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.student import Student
from app.repositories.student import StudentRepository
from app.schemas.student import StudentCreate, StudentUpdate


class StudentService:
    def __init__(self, db: Session):
        self.repo = StudentRepository(db)

    def create(self, data: StudentCreate) -> Student:
        if self.repo.get_by_email(data.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")
        student = Student(name=data.name, email=data.email, password_hash=hash_password(data.password))
        return self.repo.create(student)

    def get_or_404(self, student_id: int) -> Student:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        return student

    def list_all(self) -> list[Student]:
        return self.repo.list_all()

    def update(self, student_id: int, data: StudentUpdate) -> Student:
        student = self.get_or_404(student_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(student, field, value)
        return self.repo.update(student)

    def delete(self, student_id: int) -> None:
        student = self.get_or_404(student_id)
        self.repo.delete(student)
