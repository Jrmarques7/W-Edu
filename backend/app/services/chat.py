from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat import ChatConversation, ChatMessage
from app.models.enrollment import Enrollment
from app.models.student import Student, UserRole
from app.repositories.chat import ChatRepository
from app.repositories.course import CourseRepository
from app.repositories.enrollment import EnrollmentRepository
from app.repositories.student import StudentRepository
from app.schemas.chat import ChatConversationCreate, ChatConversationOut, ChatMessageCreate, ChatMessageOut


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ChatRepository(db)
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.student_repo = StudentRepository(db)

    def list_conversations(self, current: Student) -> list[ChatConversationOut]:
        conversations = self.repo.list_all() if current.role in {UserRole.admin, UserRole.coordinator} else self.repo.list_for_user(current.id)
        return [self._conversation_out(conversation, include_messages=False) for conversation in conversations]

    def create_conversation(self, current: Student, data: ChatConversationCreate) -> ChatConversationOut:
        self._get_course_or_404(data.course_id)
        self._ensure_course_access(data.course_id, current)
        instructor_id = self._resolve_instructor(data.instructor_id)
        existing = self.repo.get_existing(data.course_id, current.id, instructor_id)
        if existing:
            conversation = existing
        else:
            conversation = self.repo.create_conversation(
                ChatConversation(
                    course_id=data.course_id,
                    student_id=current.id,
                    instructor_id=instructor_id,
                    subject=data.subject,
                )
            )
        self._add_message(conversation, current.id, data.message)
        return self.get_conversation(conversation.id, current)

    def get_conversation(self, conversation_id: int, current: Student) -> ChatConversationOut:
        conversation = self._get_conversation_or_404(conversation_id)
        self._ensure_conversation_access(conversation, current)
        return self._conversation_out(conversation)

    def create_message(self, conversation_id: int, current: Student, data: ChatMessageCreate) -> ChatConversationOut:
        conversation = self._get_conversation_or_404(conversation_id)
        self._ensure_conversation_access(conversation, current)
        self._add_message(conversation, current.id, data.body)
        return self.get_conversation(conversation_id, current)

    def _add_message(self, conversation: ChatConversation, sender_id: int, body: str) -> None:
        self.repo.create_message(ChatMessage(conversation_id=conversation.id, sender_id=sender_id, body=body))
        conversation.updated_at = datetime.now(timezone.utc)
        self.repo.update_conversation(conversation)

    def _resolve_instructor(self, instructor_id: int | None) -> int | None:
        if instructor_id is None:
            return None
        instructor = self.student_repo.get_by_id(instructor_id)
        if not instructor or instructor.role not in {UserRole.instructor, UserRole.coordinator, UserRole.admin}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instrutor inválido")
        return instructor.id

    def _ensure_course_access(self, course_id: int, current: Student) -> None:
        if current.role in {UserRole.admin, UserRole.coordinator, UserRole.instructor}:
            return
        if self.enrollment_repo.get_by_student_and_course(current.id, course_id):
            return
        if current.role == UserRole.company_manager and current.organization_id:
            has_org_student = (
                self.db.query(Student.id)
                .join(Enrollment, Enrollment.student_id == Student.id)
                .filter(Student.organization_id == current.organization_id)
                .filter(Enrollment.course_id == course_id)
                .first()
            )
            if has_org_student:
                return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso ao chat restrito ao curso")

    def _ensure_conversation_access(self, conversation: ChatConversation, current: Student) -> None:
        if current.role in {UserRole.admin, UserRole.coordinator}:
            return
        if conversation.student_id == current.id or conversation.instructor_id == current.id:
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito à conversa")

    def _get_course_or_404(self, course_id: int):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return course

    def _get_conversation_or_404(self, conversation_id: int) -> ChatConversation:
        conversation = self.repo.get_conversation(conversation_id)
        if not conversation:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversa não encontrada")
        return conversation

    def _conversation_out(self, conversation: ChatConversation, include_messages: bool = True) -> ChatConversationOut:
        messages = conversation.messages if include_messages else []
        return ChatConversationOut(
            id=conversation.id,
            course_id=conversation.course_id,
            course_name=conversation.course.name if conversation.course else f"Curso #{conversation.course_id}",
            student_id=conversation.student_id,
            student_name=conversation.student.name if conversation.student else f"Aluno #{conversation.student_id}",
            instructor_id=conversation.instructor_id,
            instructor_name=conversation.instructor.name if conversation.instructor else None,
            subject=conversation.subject,
            messages_count=len(conversation.messages or []),
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[self._message_out(message) for message in messages],
        )

    def _message_out(self, message: ChatMessage) -> ChatMessageOut:
        return ChatMessageOut(
            id=message.id,
            conversation_id=message.conversation_id,
            sender_id=message.sender_id,
            sender_name=message.sender.name if message.sender else f"Usuário #{message.sender_id}",
            body=message.body,
            created_at=message.created_at,
        )
