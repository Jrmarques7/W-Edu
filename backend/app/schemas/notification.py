from datetime import datetime
from pydantic import BaseModel, Field

from app.models.notification import NotificationChannel, NotificationEventType, NotificationStatus


class NotificationTemplateCreate(BaseModel):
    key: str
    channel: NotificationChannel = NotificationChannel.internal
    title_template: str
    body_template: str


class NotificationTemplateUpdate(BaseModel):
    title_template: str | None = None
    body_template: str | None = None
    is_active: bool | None = None


class NotificationTemplateOut(BaseModel):
    id: int
    key: str
    channel: NotificationChannel
    title_template: str
    body_template: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NotificationEventCreate(BaseModel):
    event_type: NotificationEventType
    channel: NotificationChannel = NotificationChannel.internal
    template_key: str | None = None
    recipient_student_id: int | None = None
    course_id: int | None = None
    class_offering_id: int | None = None
    scheduled_meeting_id: int | None = None
    payload: dict = Field(default_factory=dict)
    scheduled_for: datetime | None = None


class NotificationEventOut(BaseModel):
    id: int
    event_type: NotificationEventType
    channel: NotificationChannel
    template_key: str | None
    recipient_student_id: int | None
    course_id: int | None
    class_offering_id: int | None
    scheduled_meeting_id: int | None
    payload: dict
    title: str
    body: str
    status: NotificationStatus
    scheduled_for: datetime | None
    sent_at: datetime | None
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
