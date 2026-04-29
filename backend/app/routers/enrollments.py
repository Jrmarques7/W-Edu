from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.enrollment import EnrollmentCreate, EnrollmentOut
from app.services.enrollment import EnrollmentService

router = APIRouter()


@router.post("", response_model=EnrollmentOut, status_code=201)
def enroll(data: EnrollmentCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return EnrollmentService(db).enroll(data)


@router.delete("/{student_id}/{course_id}", status_code=204)
def unenroll(
    student_id: int, course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)
):
    EnrollmentService(db).unenroll(student_id, course_id)


@router.get("/student/{student_id}", response_model=list[EnrollmentOut])
def list_by_student(
    student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)
):
    return EnrollmentService(db).list_by_student(student_id)


@router.get("/course/{course_id}", response_model=list[EnrollmentOut])
def list_by_course(
    course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)
):
    return EnrollmentService(db).list_by_course(course_id)
