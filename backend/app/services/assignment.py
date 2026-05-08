from datetime import datetime, timezone

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.storage import store_assignment_file
from app.models.assignment import AssignmentSubmission, AssignmentSubmissionStatus
from app.models.lesson import LessonType
from app.models.student import Student, UserRole
from app.repositories.assignment import AssignmentSubmissionRepository
from app.schemas.assignment import AssignmentReviewIn
from app.services.lesson import LessonService


class AssignmentSubmissionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AssignmentSubmissionRepository(db)
        self.lesson_service = LessonService(db)

    def submit(self, lesson_id: int, current: Student, text: str | None, file: UploadFile | None) -> AssignmentSubmission:
        lesson = self.lesson_service.get_or_404(lesson_id)
        if lesson.type != LessonType.assessment:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aula não aceita entrega de atividade")
        if not (text and text.strip()) and file is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Informe texto ou arquivo para a entrega")

        submission = self.repo.get_by_lesson_and_student(lesson_id, current.id)
        if submission:
            submission.text = text
            submission.status = AssignmentSubmissionStatus.submitted
            submission.score = None
            submission.feedback = None
            submission.reviewed_at = None
            submission.reviewed_by_id = None
            submission.submitted_at = datetime.now(timezone.utc)
            submission = self.repo.update(submission)
        else:
            submission = self.repo.create(
                AssignmentSubmission(
                    lesson_id=lesson.id,
                    course_id=lesson.course_id,
                    student_id=current.id,
                    text=text,
                )
            )

        if file:
            file_path, file_name, file_size = store_assignment_file(submission.id, file)
            submission.file_path = file_path
            submission.file_name = file_name
            submission.file_size = file_size
            submission = self.repo.update(submission)
        return submission

    def my_submission(self, lesson_id: int, current: Student) -> AssignmentSubmission | None:
        self.lesson_service.get_or_404(lesson_id)
        return self.repo.get_by_lesson_and_student(lesson_id, current.id)

    def list_by_lesson(self, lesson_id: int) -> list[AssignmentSubmission]:
        self.lesson_service.get_or_404(lesson_id)
        return self.repo.list_by_lesson(lesson_id)

    def review(self, submission_id: int, data: AssignmentReviewIn, reviewer: Student) -> AssignmentSubmission:
        submission = self.repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada")
        submission.status = data.status
        submission.score = data.score
        submission.feedback = data.feedback
        submission.reviewed_at = datetime.now(timezone.utc)
        submission.reviewed_by_id = reviewer.id
        return self.repo.update(submission)

    def download(self, submission_id: int, current: Student):
        submission = self.repo.get_by_id(submission_id)
        if not submission:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega não encontrada")
        if current.role not in {UserRole.admin, UserRole.coordinator} and submission.student_id != current.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito")
        if not submission.file_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entrega sem arquivo")
        return FileResponse(submission.file_path, filename=submission.file_name or "entrega")
