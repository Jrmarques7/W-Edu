from sqlalchemy.orm import Session
from app.models.course import Course


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: int) -> Course | None:
        return self.db.get(Course, course_id)

    def list_all(self) -> list[Course]:
        return self.db.query(Course).all()

    def create(self, course: Course) -> Course:
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def update(self, course: Course) -> Course:
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.db.delete(course)
        self.db.commit()
