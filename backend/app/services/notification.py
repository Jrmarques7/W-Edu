from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import (
    NotificationChannel,
    NotificationEvent,
    NotificationEventType,
    NotificationStatus,
    NotificationTemplate,
)
from app.repositories.notification import NotificationEventRepository, NotificationTemplateRepository
from app.schemas.notification import NotificationEventCreate, NotificationTemplateCreate, NotificationTemplateUpdate


class NotificationService:
    DEFAULT_TEMPLATES = {
        (NotificationEventType.class_created, NotificationChannel.internal): (
            "Nova turma criada",
            "A turma {class_name} do curso {course_name} foi criada.",
        ),
        (NotificationEventType.meeting_created, NotificationChannel.internal): (
            "Encontro agendado",
            "O encontro {meeting_title} foi agendado para {starts_at}.",
        ),
        (NotificationEventType.absence_registered, NotificationChannel.internal): (
            "Falta registrada",
            "O aluno {student_name} recebeu falta no encontro {meeting_title}.",
        ),
        (NotificationEventType.attendance_recorded, NotificationChannel.internal): (
            "Presença registrada",
            "A presença do aluno {student_name} foi registrada no encontro {meeting_title}.",
        ),
        (NotificationEventType.certificate_issued, NotificationChannel.internal): (
            "Certificado emitido",
            "O certificado do curso {course_name} foi emitido para {student_name}.",
        ),
        (NotificationEventType.meeting_reminder, NotificationChannel.internal): (
            "Lembrete de encontro",
            "Você tem um encontro em {starts_at}: {meeting_title}.",
        ),
    }

    def __init__(self, db: Session):
        self.db = db
        self.template_repo = NotificationTemplateRepository(db)
        self.event_repo = NotificationEventRepository(db)

    def list_templates(self) -> list[NotificationTemplate]:
        self._ensure_default_templates()
        return self.template_repo.list_all()

    def update_template(self, key: str, channel: NotificationChannel, data: NotificationTemplateUpdate) -> NotificationTemplate:
        template = self.template_repo.get_by_key_and_channel(key, channel)
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado")
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(template, field, value)
        return self.template_repo.update(template)

    def create_template(self, data: NotificationTemplateCreate) -> NotificationTemplate:
        existing = self.template_repo.get_by_key_and_channel(data.key, data.channel)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Template já existe")
        return self.template_repo.create(NotificationTemplate(**data.model_dump()))

    def list_events(self, limit: int = 100) -> list[NotificationEvent]:
        self._ensure_default_templates()
        return self.event_repo.list_all(limit=limit)

    def publish(
        self,
        event_type: NotificationEventType,
        payload: dict,
        *,
        channel: NotificationChannel = NotificationChannel.internal,
        template_key: str | None = None,
        recipient_student_id: int | None = None,
        course_id: int | None = None,
        class_offering_id: int | None = None,
        scheduled_meeting_id: int | None = None,
        scheduled_for: datetime | None = None,
    ) -> NotificationEvent:
        self._ensure_default_templates()
        key = template_key or event_type.value
        template = self._get_template(key, channel)
        rendered_title = self._render(template.title_template, payload)
        rendered_body = self._render(template.body_template, payload)
        status_value = NotificationStatus.sent if channel == NotificationChannel.internal else NotificationStatus.pending
        event = NotificationEvent(
            event_type=event_type,
            channel=channel,
            template_key=key,
            recipient_student_id=recipient_student_id,
            course_id=course_id,
            class_offering_id=class_offering_id,
            scheduled_meeting_id=scheduled_meeting_id,
            payload=payload,
            title=rendered_title,
            body=rendered_body,
            status=status_value,
            scheduled_for=scheduled_for,
            sent_at=datetime.now(timezone.utc) if status_value == NotificationStatus.sent else None,
        )
        return self.event_repo.create(event)

    def create_event(self, data: NotificationEventCreate) -> NotificationEvent:
        return self.publish(
            data.event_type,
            data.payload,
            channel=data.channel,
            template_key=data.template_key,
            recipient_student_id=data.recipient_student_id,
            course_id=data.course_id,
            class_offering_id=data.class_offering_id,
            scheduled_meeting_id=data.scheduled_meeting_id,
            scheduled_for=data.scheduled_for,
        )

    def mark_sent(self, event_id: int) -> NotificationEvent:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        event.status = NotificationStatus.sent
        event.sent_at = datetime.now(timezone.utc)
        event.error_message = None
        return self.event_repo.update(event)

    def mark_failed(self, event_id: int, error_message: str) -> NotificationEvent:
        event = self.event_repo.get_by_id(event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        event.status = NotificationStatus.failed
        event.error_message = error_message
        return self.event_repo.update(event)

    def _get_template(self, key: str, channel: NotificationChannel) -> NotificationTemplate:
        template = self.template_repo.get_by_key_and_channel(key, channel)
        if not template and channel != NotificationChannel.internal:
            template = self.template_repo.get_by_key_and_channel(key, NotificationChannel.internal)
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template não encontrado")
        return template

    def _ensure_default_templates(self) -> None:
        for (event_type, channel), (title_template, body_template) in self.DEFAULT_TEMPLATES.items():
            if self.template_repo.get_by_key_and_channel(event_type.value, channel):
                continue
            self.template_repo.create(
                NotificationTemplate(
                    key=event_type.value,
                    channel=channel,
                    title_template=title_template,
                    body_template=body_template,
                )
            )

    def _render(self, template: str, payload: dict) -> str:
        class SafeDict(dict):
            def __missing__(self, key):
                return ""

        return template.format_map(SafeDict(payload))
