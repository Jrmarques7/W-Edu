from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.student import User, UserRole
from app.schemas.student import (
    InstructorAvailabilityCreate,
    InstructorAvailabilityOut,
    InstructorProfileOut,
    InstructorProfileUpdate,
    StudentProfileOut,
    StudentProfileUpdate,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services.student import UserService

router = APIRouter()


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    return UserService(db).create(data)


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return current


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return UserService(db).get_or_404(user_id)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.id != user_id and current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora do seu escopo")
    if current.role != UserRole.admin:
        data = UserUpdate(name=data.name, email=data.email)
    return UserService(db).update(user_id, data)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores")
    UserService(db).delete(user_id)


@router.get("/{user_id}/student-profile", response_model=StudentProfileOut)
def get_student_profile(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return UserService(db).get_student_profile(user_id)


@router.patch("/{user_id}/student-profile", response_model=StudentProfileOut)
def update_student_profile(
    user_id: int,
    data: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.id != user_id and current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora do seu escopo")
    return UserService(db).update_student_profile(user_id, data)


@router.get("/{user_id}/instructor-profile", response_model=InstructorProfileOut)
def get_instructor_profile(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return UserService(db).get_instructor_profile(user_id)


@router.patch("/{user_id}/instructor-profile", response_model=InstructorProfileOut)
def update_instructor_profile(
    user_id: int,
    data: InstructorProfileUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.id != user_id and current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora do seu escopo")
    return UserService(db).update_instructor_profile(user_id, data)


@router.get("/{user_id}/availability", response_model=list[InstructorAvailabilityOut])
def list_instructor_availability(user_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return UserService(db).list_instructor_availability(user_id)


@router.post("/{user_id}/availability", response_model=InstructorAvailabilityOut, status_code=201)
def add_instructor_availability(
    user_id: int,
    data: InstructorAvailabilityCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.id != user_id and current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora do seu escopo")
    return UserService(db).add_instructor_availability(user_id, data)
