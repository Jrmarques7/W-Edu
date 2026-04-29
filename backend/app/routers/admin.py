from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.student import Student
from app.schemas.student import StudentOut, StudentCreate
from app.services.student import StudentService
from app.services.enrollment import EnrollmentService
from app.schemas.enrollment import EnrollmentOut

router = APIRouter()


@router.get("/students", response_model=list[StudentOut])
def list_all_students(db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return StudentService(db).list_all()


@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return StudentService(db).create(data)


@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    StudentService(db).delete(student_id)


@router.get("/enrollments/course/{course_id}", response_model=list[EnrollmentOut])
def enrollments_by_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return EnrollmentService(db).list_by_course(course_id)
