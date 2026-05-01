from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_student
from app.models.student import Student
from app.schemas.quiz import QuizWithQuestions, QuizAnswerSubmit, QuizAttemptOut
from app.services.quiz import QuizService

router = APIRouter()


@router.get("/lesson/{lesson_id}", response_model=QuizWithQuestions)
def get_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return QuizService(db).get_quiz_for_student(lesson_id)


@router.get("/lesson/{lesson_id}/optional", response_model=QuizWithQuestions | None)
def get_optional_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return QuizService(db).get_optional_quiz_for_student(lesson_id)


@router.post("/lesson/{lesson_id}/attempt", response_model=QuizAttemptOut, status_code=201)
def submit_attempt(
    lesson_id: int,
    data: QuizAnswerSubmit,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    return QuizService(db).submit_attempt(lesson_id, student.id, data)


@router.get("/lesson/{lesson_id}/attempts", response_model=list[QuizAttemptOut])
def my_attempts(
    lesson_id: int,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    return QuizService(db).get_attempts(lesson_id, student.id)


@router.get("/lesson/{lesson_id}/attempts/optional", response_model=list[QuizAttemptOut])
def my_optional_attempts(
    lesson_id: int,
    db: Session = Depends(get_db),
    student: Student = Depends(get_current_student),
):
    return QuizService(db).get_optional_attempts(lesson_id, student.id)
