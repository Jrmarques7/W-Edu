from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.forum import ForumPostCreate, ForumThreadCreate, ForumThreadOut
from app.services.forum import ForumService

router = APIRouter()


@router.get("/courses/{course_id}/threads", response_model=list[ForumThreadOut])
def list_threads(
    course_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ForumService(db).list_threads(course_id, current)


@router.post("/courses/{course_id}/threads", response_model=ForumThreadOut, status_code=201)
def create_thread(
    course_id: int,
    data: ForumThreadCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ForumService(db).create_thread(course_id, current, data)


@router.get("/threads/{thread_id}", response_model=ForumThreadOut)
def get_thread(thread_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return ForumService(db).get_thread(thread_id, current)


@router.post("/threads/{thread_id}/posts", response_model=ForumThreadOut, status_code=201)
def create_post(
    thread_id: int,
    data: ForumPostCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ForumService(db).create_post(thread_id, current, data)
