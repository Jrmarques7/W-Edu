from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.student import Student
from app.models.notification import NotificationChannel
from app.schemas.notification import (
    NotificationEventCreate,
    NotificationEventOut,
    NotificationTemplateCreate,
    NotificationTemplateOut,
    NotificationTemplateUpdate,
)
from app.services.notification import NotificationService

router = APIRouter()


@router.get("/templates", response_model=list[NotificationTemplateOut])
def list_templates(db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return NotificationService(db).list_templates()


@router.post("/templates", response_model=NotificationTemplateOut, status_code=201)
def create_template(data: NotificationTemplateCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return NotificationService(db).create_template(data)


@router.patch("/templates/{key}/{channel}", response_model=NotificationTemplateOut)
def update_template(
    key: str,
    channel: NotificationChannel,
    data: NotificationTemplateUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return NotificationService(db).update_template(key, channel, data)


@router.get("/events", response_model=list[NotificationEventOut])
def list_events(limit: int = 100, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return NotificationService(db).list_events(limit=limit)


@router.post("/events", response_model=NotificationEventOut, status_code=201)
def create_event(data: NotificationEventCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return NotificationService(db).create_event(data)


@router.post("/events/{event_id}/mark-sent", response_model=NotificationEventOut)
def mark_sent(event_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return NotificationService(db).mark_sent(event_id)


@router.post("/events/{event_id}/mark-failed", response_model=NotificationEventOut)
def mark_failed(
    event_id: int,
    error_message: str,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return NotificationService(db).mark_failed(event_id, error_message)
