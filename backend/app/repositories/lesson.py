from sqlalchemy.orm import Session
from app.models.lesson import Lesson


class LessonRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, lesson_id: int) -> Lesson | None:
        return self.db.get(Lesson, lesson_id)

    def list_by_course(self, course_id: int) -> list[Lesson]:
        return (
            self.db.query(Lesson)
            .filter(Lesson.course_id == course_id)
            .order_by(Lesson.order)
            .all()
        )

    def create(self, lesson: Lesson) -> Lesson:
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def update(self, lesson: Lesson) -> Lesson:
        self.db.commit()
        self.db.refresh(lesson)
        return lesson

    def delete(self, lesson: Lesson) -> None:
        self.db.delete(lesson)
        self.db.commit()
