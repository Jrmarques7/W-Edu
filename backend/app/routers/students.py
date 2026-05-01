from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student, UserRole
from app.schemas.student import StudentCreate, StudentUpdate, StudentOut
from app.services.student import StudentService

router = APIRouter()


@router.post("", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db)):
    return StudentService(db).create(data)


@router.get("/me", response_model=StudentOut)
def me(current: Student = Depends(get_current_student)):
    return current


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return StudentService(db).get_or_404(student_id)


@router.patch("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    if current.id != student_id and current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora do seu escopo")
    if current.role != UserRole.admin:
        data = StudentUpdate(name=data.name, email=data.email)
    return StudentService(db).update(student_id, data)


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    if current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores")
    StudentService(db).delete(student_id)
