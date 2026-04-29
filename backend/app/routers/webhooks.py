from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.session import BevoxWebhookPayload, SessionOut
from app.services.session import SessionService

router = APIRouter()


@router.post("/bevox/session-ended", response_model=SessionOut)
def bevox_session_ended(payload: BevoxWebhookPayload, db: Session = Depends(get_db)):
    """Recebe notificação do BeVox ao fim de uma sessão de voz."""
    return SessionService(db).handle_bevox_webhook(payload)
