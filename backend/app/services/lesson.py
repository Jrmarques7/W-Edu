from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.repositories.lesson import LessonRepository
from app.schemas.lesson import LessonCreate, LessonUpdate


class LessonService:
    def __init__(self, db: Session):
        self.repo = LessonRepository(db)

    def create(self, data: LessonCreate) -> Lesson:
        lesson = Lesson(**data.model_dump())
        return self.repo.create(lesson)

    def get_or_404(self, lesson_id: int) -> Lesson:
        lesson = self.repo.get_by_id(lesson_id)
        if not lesson:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
        return lesson

    def list_by_course(self, course_id: int) -> list[Lesson]:
        return self.repo.list_by_course(course_id)

    def update(self, lesson_id: int, data: LessonUpdate) -> Lesson:
        lesson = self.get_or_404(lesson_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(lesson, field, value)
        return self.repo.update(lesson)

    def delete(self, lesson_id: int) -> None:
        lesson = self.get_or_404(lesson_id)
        self.repo.delete(lesson)
