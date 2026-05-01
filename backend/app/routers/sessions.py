from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.session import SessionCreate, SessionHistoryOut, SessionOut, SessionVoiceUpdate
from app.services.session import SessionService

router = APIRouter()


@router.post("", response_model=SessionOut, status_code=201)
def start_session(
    data: SessionCreate,
    db: DBSession = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return SessionService(db).start(current.id, data.lesson_id)


@router.get("/me", response_model=list[SessionOut])
def my_sessions(db: DBSession = Depends(get_db), current: Student = Depends(get_current_student)):
    return SessionService(db).list_by_student(current.id)


@router.get("/me/history", response_model=list[SessionHistoryOut])
def my_session_history(db: DBSession = Depends(get_db), current: Student = Depends(get_current_student)):
    return SessionService(db).history_by_student(current.id)


@router.patch("/{session_id}/voice", response_model=SessionOut)
def update_voice_session(
    session_id: int,
    data: SessionVoiceUpdate,
    db: DBSession = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return SessionService(db).update_voice_state(
        session_id=session_id,
        student_id=current.id,
        bevox_session_id=data.bevox_session_id,
        transcript=data.transcript,
        ended=data.ended,
    )
