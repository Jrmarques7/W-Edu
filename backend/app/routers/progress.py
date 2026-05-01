from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.progress import CourseProgressOut, ProgressUpdate, ProgressOut
from app.services.progress import ProgressService

router = APIRouter()


@router.put("/{lesson_id}", response_model=ProgressOut)
def update_progress(
    lesson_id: int,
    data: ProgressUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ProgressService(db).mark(current.id, lesson_id, data.status)


@router.get("/me", response_model=list[ProgressOut])
def my_progress(db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return ProgressService(db).list_by_student(current.id)


@router.get("/me/courses", response_model=list[CourseProgressOut])
def my_course_progress(db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return ProgressService(db).course_summary(current.id)


@router.post("/consume/{lesson_id}", response_model=ProgressOut)
def mark_consumed(
    lesson_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return ProgressService(db).mark_consumed(current.id, lesson_id)
