from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.student import Student, UserRole
from app.repositories.student import StudentRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_student(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Student:
    student_id = decode_access_token(token)
    if not student_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    student = StudentRepository(db).get_by_id(int(student_id))
    if not student or not student.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return student


get_current_user = get_current_student


def get_current_admin(current: Student = Depends(get_current_student)) -> Student:
    if current.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores")
    return current


def get_current_admin_or_coordinator(current: Student = Depends(get_current_student)) -> Student:
    if current.role not in {UserRole.admin, UserRole.coordinator}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores e coordenadores")
    return current


def get_current_academic_staff(current: Student = Depends(get_current_student)) -> Student:
    if current.role not in {UserRole.admin, UserRole.coordinator, UserRole.company_manager}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito")
    if current.role == UserRole.company_manager and current.organization_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Gestor sem empresa vinculada")
    return current


def get_current_admin_or_company_manager(current: Student = Depends(get_current_student)) -> Student:
    if current.role not in {UserRole.admin, UserRole.company_manager}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito")
    if current.role == UserRole.company_manager and current.organization_id is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Gestor sem empresa vinculada")
    return current
