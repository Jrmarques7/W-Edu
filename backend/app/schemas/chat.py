from datetime import datetime

from pydantic import BaseModel, Field


class ChatConversationCreate(BaseModel):
    course_id: int
    instructor_id: int | None = None
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=1)


class ChatMessageCreate(BaseModel):
    body: str = Field(min_length=1)


class ChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatConversationOut(BaseModel):
    id: int
    course_id: int
    course_name: str
    student_id: int
    student_name: str
    instructor_id: int | None
    instructor_name: str | None
    subject: str | None
    messages_count: int
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageOut] = []

    model_config = {"from_attributes": True}
