from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.lesson import Lesson
from app.repositories.course import CourseModuleRepository
from app.repositories.lesson import LessonRepository
from app.schemas.lesson import LessonCreate, LessonUpdate


class LessonService:
    def __init__(self, db: Session):
        self.repo = LessonRepository(db)
        self.module_repo = CourseModuleRepository(db)

    def create(self, data: LessonCreate) -> Lesson:
        self._validate_module(data.course_id, data.module_id)
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
        payload = data.model_dump(exclude_none=True)
        if "module_id" in payload:
            self._validate_module(lesson.course_id, payload["module_id"])
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(lesson, field, value)
        return self.repo.update(lesson)

    def delete(self, lesson_id: int) -> None:
        lesson = self.get_or_404(lesson_id)
        self.repo.delete(lesson)

    def _validate_module(self, course_id: int, module_id: int | None) -> None:
        if module_id is None:
            return
        module = self.module_repo.get_by_id(module_id)
        if not module or module.course_id != course_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Módulo não pertence ao curso")
