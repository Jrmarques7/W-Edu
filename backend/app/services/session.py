from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.models.session import Session
from app.models.attendance import Attendance
from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import ProgressStatus
from app.repositories.session import SessionRepository
from app.repositories.attendance import AttendanceRepository
from app.repositories.progress import ProgressRepository
from app.schemas.session import BevoxWebhookPayload, SessionHistoryOut


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

    def history_by_student(self, student_id: int) -> list[SessionHistoryOut]:
        sessions = self.session_repo.list_by_student(student_id)
        if not sessions:
            return []

        lesson_ids = [session.lesson_id for session in sessions]
        lessons = {
            lesson.id: lesson
            for lesson in self.session_repo.db.query(Lesson).filter(Lesson.id.in_(lesson_ids)).all()
        }
        course_ids = list({lesson.course_id for lesson in lessons.values()})
        courses = {
            course.id: course
            for course in self.session_repo.db.query(Course).filter(Course.id.in_(course_ids or [-1])).all()
        }

        history: list[SessionHistoryOut] = []
        for session in sessions:
            lesson = lessons.get(session.lesson_id)
            course = courses.get(lesson.course_id) if lesson else None
            duration_minutes = None
            if session.ended_at:
                duration_seconds = max((session.ended_at - session.started_at).total_seconds(), 0)
                duration_minutes = round(duration_seconds / 60)
            history.append(
                SessionHistoryOut(
                    id=session.id,
                    student_id=session.student_id,
                    lesson_id=session.lesson_id,
                    lesson_title=lesson.title if lesson else f"Aula #{session.lesson_id}",
                    course_id=lesson.course_id if lesson else 0,
                    course_name=course.name if course else "Curso não encontrado",
                    bevox_session_id=session.bevox_session_id,
                    transcript=session.transcript,
                    has_transcript=bool(session.transcript),
                    duration_minutes=duration_minutes,
                    started_at=session.started_at,
                    ended_at=session.ended_at,
                )
            )
        return history
