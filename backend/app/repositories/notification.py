from sqlalchemy.orm import Session

from app.models.notification import NotificationEvent, NotificationTemplate, NotificationChannel


class NotificationTemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_key_and_channel(self, key: str, channel: NotificationChannel) -> NotificationTemplate | None:
        return (
            self.db.query(NotificationTemplate)
            .filter(NotificationTemplate.key == key, NotificationTemplate.channel == channel)
            .first()
        )

    def list_all(self) -> list[NotificationTemplate]:
        return self.db.query(NotificationTemplate).order_by(NotificationTemplate.key, NotificationTemplate.channel).all()

    def create(self, template: NotificationTemplate) -> NotificationTemplate:
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def update(self, template: NotificationTemplate) -> NotificationTemplate:
        self.db.commit()
        self.db.refresh(template)
        return template


class NotificationEventRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, event_id: int) -> NotificationEvent | None:
        return self.db.get(NotificationEvent, event_id)

    def list_all(self, limit: int = 100) -> list[NotificationEvent]:
        return self.db.query(NotificationEvent).order_by(NotificationEvent.created_at.desc()).limit(limit).all()

    def create(self, event: NotificationEvent) -> NotificationEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def update(self, event: NotificationEvent) -> NotificationEvent:
        self.db.commit()
        self.db.refresh(event)
        return event
