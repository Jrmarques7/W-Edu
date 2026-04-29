from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Course
from app.repositories.course import CourseRepository
from app.schemas.course import CourseCreate, CourseUpdate


class CourseService:
    def __init__(self, db: Session):
        self.repo = CourseRepository(db)

    def create(self, data: CourseCreate) -> Course:
        course = Course(**data.model_dump())
        return self.repo.create(course)

    def get_or_404(self, course_id: int) -> Course:
        course = self.repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return course

    def list_all(self) -> list[Course]:
        return self.repo.list_all()

    def update(self, course_id: int, data: CourseUpdate) -> Course:
        course = self.get_or_404(course_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(course, field, value)
        return self.repo.update(course)

    def delete(self, course_id: int) -> None:
        course = self.get_or_404(course_id)
        self.repo.delete(course)
