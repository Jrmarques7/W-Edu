from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.models.session import Session
from app.models.attendance import Attendance
from app.models.progress import ProgressStatus
from app.repositories.session import SessionRepository
from app.repositories.attendance import AttendanceRepository
from app.repositories.progress import ProgressRepository
from app.schemas.session import BevoxWebhookPayload


class SessionService:
    def __init__(self, db: DBSession):
        self.session_repo = SessionRepository(db)
        self.attendance_repo = AttendanceRepository(db)
        self.progress_repo = ProgressRepository(db)

    def start(self, student_id: int, lesson_id: int) -> Session:
        session = Session(student_id=student_id, lesson_id=lesson_id)
        return self.session_repo.create(session)

    def handle_bevox_webhook(self, payload: BevoxWebhookPayload) -> Session:
        session = self.session_repo.get_by_bevox_session_id(payload.bevox_session_id)
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada")

        session.transcript = payload.transcript
        session.ended_at = payload.ended_at or datetime.now(timezone.utc)
        self.session_repo.update(session)

        self.attendance_repo.create(
            Attendance(student_id=session.student_id, lesson_id=session.lesson_id, session_id=session.id)
        )
        self.progress_repo.upsert(session.student_id, session.lesson_id, ProgressStatus.done)

        return session

    def list_by_student(self, student_id: int) -> list[Session]:
        return self.session_repo.list_by_student(student_id)
