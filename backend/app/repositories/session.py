from sqlalchemy.orm import Session as DBSession
from app.models.session import Session


class SessionRepository:
    def __init__(self, db: DBSession):
        self.db = db

    def get_by_id(self, session_id: int) -> Session | None:
        return self.db.get(Session, session_id)

    def get_by_bevox_session_id(self, bevox_session_id: str) -> Session | None:
        return self.db.query(Session).filter(Session.bevox_session_id == bevox_session_id).first()

    def list_by_student(self, student_id: int) -> list[Session]:
        return (
            self.db.query(Session)
            .filter(Session.student_id == student_id)
            .order_by(Session.started_at.desc())
            .all()
        )

    def create(self, session: Session) -> Session:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def update(self, session: Session) -> Session:
        self.db.commit()
        self.db.refresh(session)
        return session
