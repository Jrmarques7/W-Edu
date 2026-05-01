from datetime import datetime, timezone
from email.message import EmailMessage
import smtplib

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import (
    NotificationChannel,
    NotificationEvent,
    NotificationEventType,
    NotificationStatus,
    NotificationTemplate,
)
from app.repositories.notification import NotificationEventRepository, NotificationTemplateRepository
from app.repositories.student import StudentRepository
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
        (NotificationEventType.content_published, NotificationChannel.internal): (
            "Novo conteúdo publicado",
            "A aula {lesson_title} foi publicada no curso {course_name}.",
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
        self.student_repo = StudentRepository(db)

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
        now = datetime.now(timezone.utc)
        scheduled_in_future = scheduled_for is not None and scheduled_for > now
        status_value = (
            NotificationStatus.sent
            if channel == NotificationChannel.internal and not scheduled_in_future
            else NotificationStatus.pending
        )
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
            sent_at=now if status_value == NotificationStatus.sent else None,
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

    def process_due(self, limit: int = 100) -> list[NotificationEvent]:
        events = self.event_repo.list_ready(datetime.now(timezone.utc), limit=limit)
        for event in events:
            try:
                self._dispatch(event)
                event.status = NotificationStatus.sent
                event.sent_at = datetime.now(timezone.utc)
                event.error_message = None
            except Exception as exc:
                event.status = NotificationStatus.failed
                event.error_message = str(exc)
            self.event_repo.update(event)
        return events

    def _dispatch(self, event: NotificationEvent) -> None:
        if event.channel == NotificationChannel.internal:
            return
        if event.channel == NotificationChannel.whatsapp:
            self._dispatch_whatsapp(event)
            return
        if event.channel == NotificationChannel.email:
            self._dispatch_email(event)
            return
        raise RuntimeError(f"Canal {event.channel.value} ainda não possui adaptador configurado")

    def _dispatch_whatsapp(self, event: NotificationEvent) -> None:
        if not settings.WOMNI_URL:
            raise RuntimeError("WOMNI_URL não configurado")
        if not event.recipient_student_id:
            raise RuntimeError("Evento WhatsApp sem recipient_student_id")

        student = self.student_repo.get_by_id(event.recipient_student_id)
        phone = student.student_profile.phone if student and student.student_profile else None
        if not student or not phone:
            raise RuntimeError("Destinatário sem telefone cadastrado")

        headers = {}
        if settings.WOMNI_API_TOKEN:
            headers["Authorization"] = f"Bearer {settings.WOMNI_API_TOKEN}"

        base_url = settings.WOMNI_URL.rstrip("/")
        payload = {
            "channel": "whatsapp",
            "to": phone,
            "recipient": {
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
            },
            "message": {
                "title": event.title,
                "body": event.body,
            },
            "metadata": {
                "source": "w-edu",
                "event_id": event.id,
                "event_type": event.event_type.value,
                "course_id": event.course_id,
                "class_offering_id": event.class_offering_id,
                "scheduled_meeting_id": event.scheduled_meeting_id,
                "payload": event.payload,
            },
        }
        with httpx.Client(timeout=settings.NOTIFICATION_DISPATCH_TIMEOUT_SECONDS) as client:
            response = client.post(f"{base_url}/messages", json=payload, headers=headers)
            response.raise_for_status()

    def _dispatch_email(self, event: NotificationEvent) -> None:
        if not settings.SMTP_HOST:
            raise RuntimeError("SMTP_HOST não configurado")
        if not settings.SMTP_FROM_EMAIL:
            raise RuntimeError("SMTP_FROM_EMAIL não configurado")
        if not event.recipient_student_id:
            raise RuntimeError("Evento email sem recipient_student_id")

        student = self.student_repo.get_by_id(event.recipient_student_id)
        if not student or not student.email:
            raise RuntimeError("Destinatário sem email cadastrado")

        message = EmailMessage()
        message["Subject"] = event.title
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = student.email
        message.set_content(event.body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.NOTIFICATION_DISPATCH_TIMEOUT_SECONDS) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD or "")
            smtp.send_message(message)

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
