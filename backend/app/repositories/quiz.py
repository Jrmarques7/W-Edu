from typing import Optional
from sqlalchemy.orm import Session

from app.models.quiz import Quiz, QuizQuestion, QuizAttempt


class QuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_lesson(self, lesson_id: int) -> Optional[Quiz]:
        return self.db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()

    def get_by_id(self, quiz_id: int) -> Optional[Quiz]:
        return self.db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def create(self, lesson_id: int, passing_score: int, max_attempts: int) -> Quiz:
        quiz = Quiz(lesson_id=lesson_id, passing_score=passing_score, max_attempts=max_attempts)
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def update(self, quiz: Quiz, **kwargs) -> Quiz:
        for k, v in kwargs.items():
            setattr(quiz, k, v)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def delete(self, quiz: Quiz) -> None:
        self.db.delete(quiz)
        self.db.commit()


class QuizQuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, question_id: int) -> Optional[QuizQuestion]:
        return self.db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()

    def create(self, quiz_id: int, question: str, options: list, correct_index: int, order: int) -> QuizQuestion:
        q = QuizQuestion(quiz_id=quiz_id, question=question, options=options, correct_index=correct_index, order=order)
        self.db.add(q)
        self.db.commit()
        self.db.refresh(q)
        return q

    def update(self, question: QuizQuestion, **kwargs) -> QuizQuestion:
        for k, v in kwargs.items():
            setattr(question, k, v)
        self.db.commit()
        self.db.refresh(question)
        return question

    def delete(self, question: QuizQuestion) -> None:
        self.db.delete(question)
        self.db.commit()


class QuizAttemptRepository:
    def __init__(self, db: Session):
        self.db = db

    def count_attempts(self, student_id: int, quiz_id: int) -> int:
        return self.db.query(QuizAttempt).filter(
            QuizAttempt.student_id == student_id,
            QuizAttempt.quiz_id == quiz_id,
        ).count()

    def get_best(self, student_id: int, quiz_id: int) -> Optional[QuizAttempt]:
        return (
            self.db.query(QuizAttempt)
            .filter(QuizAttempt.student_id == student_id, QuizAttempt.quiz_id == quiz_id)
            .order_by(QuizAttempt.score.desc())
            .first()
        )

    def list_by_student_and_quiz(self, student_id: int, quiz_id: int) -> list[QuizAttempt]:
        return (
            self.db.query(QuizAttempt)
            .filter(QuizAttempt.student_id == student_id, QuizAttempt.quiz_id == quiz_id)
            .order_by(QuizAttempt.attempted_at.desc())
            .all()
        )

    def create(self, student_id: int, quiz_id: int, score: int, passed: bool, answers: dict) -> QuizAttempt:
        attempt = QuizAttempt(student_id=student_id, quiz_id=quiz_id, score=score, passed=passed, answers=answers)
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt
