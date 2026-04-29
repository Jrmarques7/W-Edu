from sqlalchemy.orm import Session
from app.models.progress import Progress, ProgressStatus


class ProgressRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_student_and_lesson(self, student_id: int, lesson_id: int) -> Progress | None:
        return (
            self.db.query(Progress)
            .filter(Progress.student_id == student_id, Progress.lesson_id == lesson_id)
            .first()
        )

    def list_by_student(self, student_id: int) -> list[Progress]:
        return self.db.query(Progress).filter(Progress.student_id == student_id).all()

    def upsert(self, student_id: int, lesson_id: int, status: ProgressStatus) -> Progress:
        record = self.get_by_student_and_lesson(student_id, lesson_id)
        if record:
            record.status = status
        else:
            record = Progress(student_id=student_id, lesson_id=lesson_id, status=status)
            self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record
