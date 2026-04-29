from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student, get_current_admin
from app.models.student import Student
from app.schemas.course import CourseCreate, CourseUpdate, CourseOut
from app.services.course import CourseService

router = APIRouter()


@router.post("", response_model=CourseOut, status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return CourseService(db).create(data)


@router.get("", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return CourseService(db).list_all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return CourseService(db).get_or_404(course_id)


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int, data: CourseUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)
):
    return CourseService(db).update(course_id, data)


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    CourseService(db).delete(course_id)
