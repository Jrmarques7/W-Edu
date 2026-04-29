from sqlalchemy.orm import Session

from app.models.progress import Progress, ProgressStatus
from app.repositories.progress import ProgressRepository


class ProgressService:
    def __init__(self, db: Session):
        self.repo = ProgressRepository(db)

    def mark(self, student_id: int, lesson_id: int, status: ProgressStatus) -> Progress:
        return self.repo.upsert(student_id, lesson_id, status)

    def list_by_student(self, student_id: int) -> list[Progress]:
        return self.repo.list_by_student(student_id)
