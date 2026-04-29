from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, TokenOut
from app.services.auth import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    token = AuthService(db).login(data.email, data.password)
    return TokenOut(access_token=token)
