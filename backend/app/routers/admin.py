from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_academic_staff, get_current_admin, get_current_admin_or_coordinator
from app.models.student import Student
from app.models.student import UserRole
from app.schemas.student import StudentOut, StudentCreate
from app.schemas.student import (
    InstructorAvailabilityCreate,
    InstructorAvailabilityOut,
    InstructorAvailabilityUpdate,
    InstructorRatingCreate,
    InstructorRatingOut,
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

MANAGEABLE_ACADEMIC_ROLES = {UserRole.student, UserRole.instructor}
PRIVILEGED_ROLES = {UserRole.admin, UserRole.coordinator, UserRole.company_manager}


def ensure_academic_user_scope(current: Student, target: Student) -> None:
    if current.role == UserRole.admin:
        return
    if current.role == UserRole.company_manager and target.organization_id != current.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuário fora da empresa")
    if target.role not in MANAGEABLE_ACADEMIC_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil fora do escopo")


@router.get("/students", response_model=list[StudentOut])
@router.get("/users", response_model=list[StudentOut])
def list_all_students(db: Session = Depends(get_db), current: Student = Depends(get_current_academic_staff)):
    service = StudentService(db)
    if current.role == UserRole.company_manager:
        return service.list_by_organization(current.organization_id)
    return service.list_all()


@router.post("/students", response_model=StudentOut, status_code=201)
@router.post("/users", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), current: Student = Depends(get_current_academic_staff)):
    if current.role in {UserRole.company_manager, UserRole.coordinator}:
        if data.role in PRIVILEGED_ROLES:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil sem permissão para criar este papel")
    if current.role == UserRole.company_manager:
        data = data.model_copy(update={"organization_id": current.organization_id})
    return StudentService(db).create(data)


@router.patch("/students/{student_id}", response_model=StudentOut)
@router.patch("/users/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    if current.role in {UserRole.company_manager, UserRole.coordinator}:
        target = StudentService(db).get_or_404(student_id)
        ensure_academic_user_scope(current, target)
    if current.role == UserRole.company_manager:
        data = data.model_copy(update={"organization_id": current.organization_id})
    if current.role in {UserRole.company_manager, UserRole.coordinator} and data.role in PRIVILEGED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Perfil sem permissão para atribuir este papel")
    return StudentService(db).update(student_id, data)


@router.delete("/students/{student_id}", status_code=204)
@router.delete("/users/{student_id}", status_code=204)
def delete_student(student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    StudentService(db).delete(student_id)


@router.get("/students/{student_id}/student-profile", response_model=StudentProfileOut)
@router.get("/users/{student_id}/student-profile", response_model=StudentProfileOut)
def get_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).get_student_profile(student_id)


@router.patch("/students/{student_id}/student-profile", response_model=StudentProfileOut)
@router.patch("/users/{student_id}/student-profile", response_model=StudentProfileOut)
def update_student_profile(
    student_id: int,
    data: StudentProfileUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).update_student_profile(student_id, data)


@router.get("/students/{student_id}/instructor-profile", response_model=InstructorProfileOut)
@router.get("/users/{student_id}/instructor-profile", response_model=InstructorProfileOut)
def get_instructor_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).get_instructor_profile(student_id)


@router.patch("/students/{student_id}/instructor-profile", response_model=InstructorProfileOut)
@router.patch("/users/{student_id}/instructor-profile", response_model=InstructorProfileOut)
def update_instructor_profile(
    student_id: int,
    data: InstructorProfileUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).update_instructor_profile(student_id, data)


@router.get("/students/{student_id}/availability", response_model=list[InstructorAvailabilityOut])
@router.get("/users/{student_id}/availability", response_model=list[InstructorAvailabilityOut])
def list_instructor_availability(
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).list_instructor_availability(student_id)


@router.post("/students/{student_id}/availability", response_model=InstructorAvailabilityOut, status_code=201)
@router.post("/users/{student_id}/availability", response_model=InstructorAvailabilityOut, status_code=201)
def add_instructor_availability(
    student_id: int,
    data: InstructorAvailabilityCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).add_instructor_availability(student_id, data)


@router.patch("/students/availability/{availability_id}", response_model=InstructorAvailabilityOut)
@router.patch("/users/availability/{availability_id}", response_model=InstructorAvailabilityOut)
def update_instructor_availability(
    availability_id: int,
    data: InstructorAvailabilityUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    return StudentService(db).update_instructor_availability(availability_id, data)


@router.get("/students/{student_id}/ratings", response_model=list[InstructorRatingOut])
@router.get("/users/{student_id}/ratings", response_model=list[InstructorRatingOut])
def list_instructor_ratings(
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).list_instructor_ratings(student_id)


@router.post("/students/{student_id}/ratings", response_model=InstructorRatingOut, status_code=201)
@router.post("/users/{student_id}/ratings", response_model=InstructorRatingOut, status_code=201)
def add_instructor_rating(
    student_id: int,
    data: InstructorRatingCreate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_academic_staff),
):
    target = StudentService(db).get_or_404(student_id)
    ensure_academic_user_scope(current, target)
    return StudentService(db).add_instructor_rating(current.id, student_id, data)


@router.post("/organizations", response_model=OrganizationOut, status_code=201)
def create_organization(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return OrganizationService(db).create(data)


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(db: Session = Depends(get_db), current: Student = Depends(get_current_academic_staff)):
    return OrganizationService(db).list_for_user(current)


@router.patch("/organizations/{organization_id}", response_model=OrganizationOut)
def update_organization(
    organization_id: int,
    data: OrganizationUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return OrganizationService(db).update(organization_id, data)


@router.get("/enrollments/course/{course_id}", response_model=list[EnrollmentOut])
def enrollments_by_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return EnrollmentService(db).list_by_course(course_id)


# --- Quiz management ---

@router.post("/quizzes", response_model=QuizOut, status_code=201)
def create_quiz(data: QuizCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return QuizService(db).create_quiz(data)


@router.get("/quizzes/lesson/{lesson_id}", response_model=QuizWithAnswers)
def get_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return QuizService(db).get_quiz_with_answers(lesson_id)


@router.patch("/quizzes/lesson/{lesson_id}", response_model=QuizOut)
def update_quiz(lesson_id: int, data: QuizUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return QuizService(db).update_quiz(lesson_id, data)


@router.delete("/quizzes/lesson/{lesson_id}", status_code=204)
def delete_quiz(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    QuizService(db).delete_quiz(lesson_id)


@router.post("/quizzes/lesson/{lesson_id}/questions", response_model=QuizQuestionWithAnswer, status_code=201)
def add_question(lesson_id: int, data: QuizQuestionCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return QuizService(db).add_question(lesson_id, data)


@router.patch("/quiz-questions/{question_id}", response_model=QuizQuestionWithAnswer)
def update_question(question_id: int, data: QuizQuestionUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return QuizService(db).update_question(question_id, data)


@router.delete("/quiz-questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    QuizService(db).delete_question(question_id)
