from fastapi import APIRouter, Depends, Query, Request, UploadFile
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.dependencies import get_current_admin, get_current_admin_or_coordinator, get_current_student
from app.models.student import Student
from app.repositories.student import StudentRepository
from app.schemas.lesson import LessonCreate, LessonOut, LessonUpdate
from app.services.lesson import LessonService
from app.services.video import VideoService

router = APIRouter()

_oauth2_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _get_streaming_student(
    db: Session = Depends(get_db),
    bearer: str | None = Depends(_oauth2_optional),
    token: str | None = Query(None),
) -> Student:
    resolved = bearer or token
    if not resolved:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    student_id = decode_access_token(resolved)
    if not student_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    student = StudentRepository(db).get_by_id(int(student_id))
    if not student or not student.is_active:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return student


@router.post("", response_model=LessonOut, status_code=201)
def create_lesson(data: LessonCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return LessonService(db).create(data)


@router.get("/course/{course_id}", response_model=list[LessonOut])
def list_lessons_by_course(
    course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)
):
    return LessonService(db).list_by_course(course_id)


@router.get("/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return LessonService(db).get_or_404(lesson_id)


@router.patch("/{lesson_id}", response_model=LessonOut)
def update_lesson(
    lesson_id: int, data: LessonUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)
):
    return LessonService(db).update(lesson_id, data)


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    LessonService(db).delete(lesson_id)


@router.post("/{lesson_id}/video", response_model=LessonOut)
def upload_lesson_video(
    lesson_id: int,
    file: UploadFile,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    svc = LessonService(db)
    lesson = svc.get_or_404(lesson_id)
    video_path = VideoService().upload(lesson, file)
    lesson.video_path = video_path
    return svc.repo.update(lesson)


@router.get("/{lesson_id}/video/stream")
def stream_lesson_video(
    lesson_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: Student = Depends(_get_streaming_student),
):
    lesson = LessonService(db).get_or_404(lesson_id)
    if not lesson.video_path:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhum arquivo de vídeo para esta aula")
    return VideoService().stream(lesson.video_path, request.headers.get("range"))


@router.delete("/{lesson_id}/video", response_model=LessonOut)
def delete_lesson_video(
    lesson_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    svc = LessonService(db)
    lesson = svc.get_or_404(lesson_id)
    VideoService().delete(lesson)
    lesson.video_path = None
    return svc.repo.update(lesson)
