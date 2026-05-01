from sqlalchemy.orm import Session, selectinload

from app.models.chat import ChatConversation, ChatMessage


class ChatRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_conversation(self, conversation_id: int) -> ChatConversation | None:
        return (
            self.db.query(ChatConversation)
            .options(
                selectinload(ChatConversation.course),
                selectinload(ChatConversation.student),
                selectinload(ChatConversation.instructor),
                selectinload(ChatConversation.messages).selectinload(ChatMessage.sender),
            )
            .filter(ChatConversation.id == conversation_id)
            .first()
        )

    def get_existing(self, course_id: int, student_id: int, instructor_id: int | None) -> ChatConversation | None:
        return (
            self.db.query(ChatConversation)
            .filter(ChatConversation.course_id == course_id)
            .filter(ChatConversation.student_id == student_id)
            .filter(ChatConversation.instructor_id == instructor_id)
            .first()
        )

    def list_for_user(self, user_id: int) -> list[ChatConversation]:
        return (
            self.db.query(ChatConversation)
            .options(
                selectinload(ChatConversation.course),
                selectinload(ChatConversation.student),
                selectinload(ChatConversation.instructor),
                selectinload(ChatConversation.messages),
            )
            .filter((ChatConversation.student_id == user_id) | (ChatConversation.instructor_id == user_id))
            .order_by(ChatConversation.updated_at.desc())
            .all()
        )

    def list_all(self) -> list[ChatConversation]:
        return (
            self.db.query(ChatConversation)
            .options(
                selectinload(ChatConversation.course),
                selectinload(ChatConversation.student),
                selectinload(ChatConversation.instructor),
                selectinload(ChatConversation.messages),
            )
            .order_by(ChatConversation.updated_at.desc())
            .all()
        )

    def create_conversation(self, conversation: ChatConversation) -> ChatConversation:
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def create_message(self, message: ChatMessage) -> ChatMessage:
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def update_conversation(self, conversation: ChatConversation) -> ChatConversation:
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
