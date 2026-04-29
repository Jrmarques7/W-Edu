from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student, get_current_admin
from app.models.student import Student
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonOut
from app.services.lesson import LessonService

router = APIRouter()


@router.post("", response_model=LessonOut, status_code=201)
def create_lesson(data: LessonCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return LessonService(db).create(data)


@router.get("/course/{course_id}", response_model=list[LessonOut])
def list_lessons_by_course(
    course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)
):
    return LessonService(db).list_by_course(course_id)


@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return LessonService(db).get_or_404(lesson_id)


@router.patch("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: int, data: LessonUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)
):
    return LessonService(db).update(lesson_id, data)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    LessonService(db).delete(lesson_id)
