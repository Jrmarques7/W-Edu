from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.repositories.quiz import QuizRepository, QuizQuestionRepository, QuizAttemptRepository
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizQuestionCreate, QuizQuestionUpdate, QuizAnswerSubmit
from app.repositories.lesson import LessonRepository
from app.services.certificate import CertificateService


class QuizService:
    def __init__(self, db: Session):
        self.repo = QuizRepository(db)
        self.question_repo = QuizQuestionRepository(db)
        self.attempt_repo = QuizAttemptRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.certificate_service = CertificateService(db)

    # --- Admin ---

    def create_quiz(self, data: QuizCreate) -> Quiz:
        if self.repo.get_by_lesson(data.lesson_id):
            raise HTTPException(status_code=400, detail="Esta aula já possui um quiz.")
        return self.repo.create(data.lesson_id, data.passing_score, data.max_attempts)

    def update_quiz(self, lesson_id: int, data: QuizUpdate) -> Quiz:
        quiz = self._get_quiz_or_404(lesson_id)
        return self.repo.update(quiz, **data.model_dump(exclude_none=True))

    def delete_quiz(self, lesson_id: int) -> None:
        quiz = self._get_quiz_or_404(lesson_id)
        self.repo.delete(quiz)

    def add_question(self, lesson_id: int, data: QuizQuestionCreate) -> QuizQuestion:
        quiz = self._get_quiz_or_404(lesson_id)
        if data.correct_index >= len(data.options):
            raise HTTPException(status_code=400, detail="correct_index fora do range de opções.")
        return self.question_repo.create(quiz.id, data.question, data.options, data.correct_index, data.order)

    def update_question(self, question_id: int, data: QuizQuestionUpdate) -> QuizQuestion:
        question = self._get_question_or_404(question_id)
        return self.question_repo.update(question, **data.model_dump(exclude_none=True))

    def delete_question(self, question_id: int) -> None:
        question = self._get_question_or_404(question_id)
        self.question_repo.delete(question)

    def get_quiz_with_answers(self, lesson_id: int) -> Quiz:
        return self._get_quiz_or_404(lesson_id)

    # --- Student ---

    def get_quiz_for_student(self, lesson_id: int) -> Quiz:
        return self._get_quiz_or_404(lesson_id)

    def get_optional_quiz_for_student(self, lesson_id: int) -> Quiz | None:
        return self.repo.get_by_lesson(lesson_id)

    def submit_attempt(self, lesson_id: int, student_id: int, data: QuizAnswerSubmit) -> QuizAttempt:
        quiz = self._get_quiz_or_404(lesson_id)

        if quiz.max_attempts > 0:
            count = self.attempt_repo.count_attempts(student_id, quiz.id)
            if count >= quiz.max_attempts:
                raise HTTPException(status_code=400, detail="Número máximo de tentativas atingido.")

        if not quiz.questions:
            raise HTTPException(status_code=400, detail="Quiz sem questões.")

        correct = sum(
            1 for q in quiz.questions
            if data.answers.get(str(q.id)) == q.correct_index
        )
        score = round(correct / len(quiz.questions) * 100)
        passed = score >= quiz.passing_score

        attempt = self.attempt_repo.create(student_id, quiz.id, score, passed, data.answers)
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if lesson:
            self.certificate_service.auto_issue(lesson.course_id, student_id)
        return attempt

    def get_attempts(self, lesson_id: int, student_id: int) -> list[QuizAttempt]:
        quiz = self._get_quiz_or_404(lesson_id)
        return self.attempt_repo.list_by_student_and_quiz(student_id, quiz.id)

    def get_optional_attempts(self, lesson_id: int, student_id: int) -> list[QuizAttempt]:
        quiz = self.repo.get_by_lesson(lesson_id)
        if not quiz:
            return []
        return self.attempt_repo.list_by_student_and_quiz(student_id, quiz.id)

    # --- Internal ---

    def _get_quiz_or_404(self, lesson_id: int) -> Quiz:
        quiz = self.repo.get_by_lesson(lesson_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz não encontrado para esta aula.")
        return quiz

    def _get_question_or_404(self, question_id: int) -> QuizQuestion:
        question = self.question_repo.get_by_id(question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Questão não encontrada.")
        return question
