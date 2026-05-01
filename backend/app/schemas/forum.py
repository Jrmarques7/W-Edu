from datetime import datetime

from pydantic import BaseModel, Field


class ForumThreadCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=1)


class ForumPostCreate(BaseModel):
    body: str = Field(min_length=1)


class ForumPostOut(BaseModel):
    id: int
    thread_id: int
    author_id: int
    author_name: str
    body: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ForumThreadOut(BaseModel):
    id: int
    course_id: int
    author_id: int
    author_name: str
    title: str
    body: str
    replies_count: int
    created_at: datetime
    updated_at: datetime
    posts: list[ForumPostOut] = []

    model_config = {"from_attributes": True}
