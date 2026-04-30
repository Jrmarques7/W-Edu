from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_student
from app.models.student import Student
from app.schemas.course import (
    LearningPathCourseCreate,
    LearningPathCourseOut,
    LearningPathCreate,
    LearningPathOut,
    LearningPathUpdate,
)
from app.services.course import LearningPathService

router = APIRouter()


@router.post("", response_model=LearningPathOut, status_code=201)
def create_learning_path(
    data: LearningPathCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return LearningPathService(db).create(data)


@router.get("", response_model=list[LearningPathOut])
def list_learning_paths(db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return LearningPathService(db).list_all()


@router.get("/{path_id}", response_model=LearningPathOut)
def get_learning_path(path_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return LearningPathService(db).get_or_404(path_id)


@router.patch("/{path_id}", response_model=LearningPathOut)
def update_learning_path(
    path_id: int,
    data: LearningPathUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return LearningPathService(db).update(path_id, data)


@router.delete("/{path_id}", status_code=204)
def delete_learning_path(path_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    LearningPathService(db).delete(path_id)


@router.post("/{path_id}/courses", response_model=LearningPathCourseOut, status_code=201)
def add_course_to_learning_path(
    path_id: int,
    data: LearningPathCourseCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return LearningPathService(db).add_course(path_id, data)


@router.get("/{path_id}/courses", response_model=list[LearningPathCourseOut])
def list_learning_path_courses(
    path_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_student),
):
    return LearningPathService(db).list_courses(path_id)


@router.delete("/{path_id}/courses/{course_id}", status_code=204)
def remove_course_from_learning_path(
    path_id: int,
    course_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    LearningPathService(db).remove_course(path_id, course_id)
