from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.repositories.enrollment import EnrollmentRepository
from app.schemas.enrollment import EnrollmentCreate


class EnrollmentService:
    def __init__(self, db: Session):
        self.repo = EnrollmentRepository(db)

    def enroll(self, data: EnrollmentCreate) -> Enrollment:
        if self.repo.get_by_student_and_course(data.student_id, data.course_id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Aluno já matriculado neste curso")
        enrollment = Enrollment(student_id=data.student_id, course_id=data.course_id)
        return self.repo.create(enrollment)

    def unenroll(self, student_id: int, course_id: int) -> None:
        enrollment = self.repo.get_by_student_and_course(student_id, course_id)
        if not enrollment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matrícula não encontrada")
        self.repo.delete(enrollment)

    def list_by_student(self, student_id: int) -> list[Enrollment]:
        return self.repo.list_by_student(student_id)

    def list_by_course(self, course_id: int) -> list[Enrollment]:
        return self.repo.list_by_course(course_id)
