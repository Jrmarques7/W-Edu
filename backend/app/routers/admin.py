from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.student import Student
from app.schemas.student import StudentOut, StudentCreate
from app.schemas.student import (
    InstructorProfileOut,
    InstructorProfileUpdate,
    OrganizationCreate,
    OrganizationOut,
    OrganizationUpdate,
    StudentProfileOut,
    StudentProfileUpdate,
    StudentUpdate,
)
from app.schemas.quiz import QuizCreate, QuizUpdate, QuizOut, QuizWithAnswers, QuizQuestionCreate, QuizQuestionUpdate, QuizQuestionWithAnswer
from app.services.student import OrganizationService, StudentService
from app.services.enrollment import EnrollmentService
from app.services.quiz import QuizService
from app.schemas.enrollment import EnrollmentOut

router = APIRouter()


@router.get("/students", response_model=list[StudentOut])
def list_all_students(db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return StudentService(db).list_all()


@router.post("/students", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return StudentService(db).create(data)


@router.patch("/students/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return StudentService(db).update(student_id, data)


@router.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    StudentService(db).delete(student_id)


@router.patch("/students/{student_id}/student-profile", response_model=StudentProfileOut)
def update_student_profile(
    student_id: int,
    data: StudentProfileUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return StudentService(db).update_student_profile(student_id, data)


@router.patch("/students/{student_id}/instructor-profile", response_model=InstructorProfileOut)
def update_instructor_profile(
    student_id: int,
    data: InstructorProfileUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return StudentService(db).update_instructor_profile(student_id, data)


@router.post("/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return OrganizationService(db).create(data)


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return OrganizationService(db).list_all()


@router.patch("/organizations/{organization_id}", response_model=OrganizationOut)
def update_organization(
    organization_id: int,
    data: OrganizationUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return OrganizationService(db).update(organization_id, data)


@router.get("/enrollments/course/{course_id}", response_model=list[EnrollmentOut])
def enrollments_by_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return EnrollmentService(db).list_by_course(course_id)


# --- Quiz management ---

@router.post("/quizzes", response_model=QuizOut, status_code=201)
def create_quiz(data: QuizCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return QuizService(db).create_quiz(data)


@router.get("/quizzes/lesson/{lesson_id}", response_model=QuizWithAnswers)
def get_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return QuizService(db).get_quiz_with_answers(lesson_id)


@router.patch("/quizzes/lesson/{lesson_id}", response_model=QuizOut)
def update_quiz(lesson_id: int, data: QuizUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return QuizService(db).update_quiz(lesson_id, data)


@router.delete("/quizzes/lesson/{lesson_id}", status_code=204)
def delete_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    QuizService(db).delete_quiz(lesson_id)


@router.post("/quizzes/lesson/{lesson_id}/questions", response_model=QuizQuestionWithAnswer, status_code=201)
def add_question(lesson_id: int, data: QuizQuestionCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return QuizService(db).add_question(lesson_id, data)


@router.patch("/quiz-questions/{question_id}", response_model=QuizQuestionWithAnswer)
def update_question(question_id: int, data: QuizQuestionUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return QuizService(db).update_question(question_id, data)


@router.delete("/quiz-questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    QuizService(db).delete_question(question_id)
