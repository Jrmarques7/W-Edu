from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.progress import Progress, ProgressStatus
from app.repositories.lesson import LessonRepository
from app.repositories.progress import ProgressRepository
from app.services.certificate import CertificateService


class ProgressService:
    def __init__(self, db: Session):
        self.repo = ProgressRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.certificate_service = CertificateService(db)

    def mark(self, student_id: int, lesson_id: int, status: ProgressStatus) -> Progress:
        progress = self.repo.upsert(student_id, lesson_id, status)
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if lesson:
            self.certificate_service.auto_issue(lesson.course_id, student_id)
        return progress

    def mark_consumed(self, student_id: int, lesson_id: int) -> Progress:
        progress = self.repo.upsert(student_id, lesson_id, ProgressStatus.in_progress)
        if not progress.content_consumed_at:
            progress.content_consumed_at = datetime.now(timezone.utc)
            self.repo.db.commit()
            self.repo.db.refresh(progress)
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if lesson:
            self.certificate_service.auto_issue(lesson.course_id, student_id)
        return progress

    def list_by_student(self, student_id: int) -> list[Progress]:
        return self.repo.list_by_student(student_id)
