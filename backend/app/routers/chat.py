from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.chat import ChatConversationCreate, ChatConversationOut, ChatMessageCreate
from app.services.chat import ChatService

router = APIRouter()


@router.get("/conversations", response_model=list[ChatConversationOut])
def list_conversations(db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return ChatService(db).list_conversations(current)


@router.post("/conversations", response_model=ChatConversationOut, status_code=201)
def create_conversation(
    data: ChatConversationCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ChatService(db).create_conversation(current, data)


@router.get("/conversations/{conversation_id}", response_model=ChatConversationOut)
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ChatService(db).get_conversation(conversation_id, current)


@router.post("/conversations/{conversation_id}/messages", response_model=ChatConversationOut, status_code=201)
def create_message(
    conversation_id: int,
    data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ChatService(db).create_message(conversation_id, current, data)
