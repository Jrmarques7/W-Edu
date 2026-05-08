from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin_or_coordinator, get_current_student
from app.models.student import Student
from app.schemas.assignment import AssignmentReviewIn, AssignmentSubmissionOut
from app.services.assignment import AssignmentSubmissionService

router = APIRouter()


@router.get("/lessons/{lesson_id}/me", response_model=AssignmentSubmissionOut | None)
def my_lesson_submission(
    lesson_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return AssignmentSubmissionService(db).my_submission(lesson_id, current)


@router.post("/lessons/{lesson_id}/submit", response_model=AssignmentSubmissionOut, status_code=201)
def submit_assignment(
    lesson_id: int,
    text: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return AssignmentSubmissionService(db).submit(lesson_id, current, text, file)


@router.get("/lessons/{lesson_id}/submissions", response_model=list[AssignmentSubmissionOut])
def list_lesson_submissions(
    lesson_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    return AssignmentSubmissionService(db).list_by_lesson(lesson_id)


@router.patch("/submissions/{submission_id}", response_model=AssignmentSubmissionOut)
def review_submission(
    submission_id: int,
    data: AssignmentReviewIn,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_coordinator),
):
    return AssignmentSubmissionService(db).review(submission_id, data, current)


@router.get("/submissions/{submission_id}/download")
def download_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_student),
):
    return AssignmentSubmissionService(db).download(submission_id, current)
