from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token
from app.repositories.student import StudentRepository


class AuthService:
    def __init__(self, db: Session):
        self.repo = StudentRepository(db)

    def login(self, email: str, password: str) -> str:
        student = self.repo.get_by_email(email)
        if not student or not verify_password(password, student.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
        if not student.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta inativa")
        return create_access_token(str(student.id))
