from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_admin_or_coordinator, get_current_student
from app.models.student import Student
from app.schemas.course import (
    CourseCreate,
    CourseModuleCreate,
    CourseModuleOut,
    CourseModuleUpdate,
    CourseOut,
    CoursePrerequisiteCreate,
    CoursePrerequisiteOut,
    CourseUpdate,
)
from app.services.course import CourseModuleService, CoursePrerequisiteService, CourseService

router = APIRouter()


@router.post("", response_model=CourseOut, status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)):
    return CourseService(db).create(data)


@router.get("", response_model=list[CourseOut])
def list_courses(db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return CourseService(db).list_all()


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return CourseService(db).get_or_404(course_id)


@router.patch("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int, data: CourseUpdate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin_or_coordinator)
):
    return CourseService(db).update(course_id, data)


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    CourseService(db).delete(course_id)


@router.post("/{course_id}/modules", response_model=CourseModuleOut, status_code=201)
def create_module(
    course_id: int,
    data: CourseModuleCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    payload = data.model_copy(update={"course_id": course_id})
    return CourseModuleService(db).create(payload)


@router.get("/{course_id}/modules", response_model=list[CourseModuleOut])
def list_modules(
    course_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_student),
):
    return CourseModuleService(db).list_by_course(course_id)


@router.patch("/modules/{module_id}", response_model=CourseModuleOut)
def update_module(
    module_id: int,
    data: CourseModuleUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    return CourseModuleService(db).update(module_id, data)


@router.delete("/modules/{module_id}", status_code=204)
def delete_module(module_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    CourseModuleService(db).delete(module_id)


@router.post("/{course_id}/prerequisites", response_model=CoursePrerequisiteOut, status_code=201)
def create_prerequisite(
    course_id: int,
    data: CoursePrerequisiteCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin_or_coordinator),
):
    return CoursePrerequisiteService(db).create(course_id, data)


@router.get("/{course_id}/prerequisites", response_model=list[CoursePrerequisiteOut])
def list_prerequisites(
    course_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_student),
):
    return CoursePrerequisiteService(db).list_by_course(course_id)


@router.delete("/{course_id}/prerequisites/{prerequisite_course_id}", status_code=204)
def delete_prerequisite(
    course_id: int,
    prerequisite_course_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    CoursePrerequisiteService(db).delete(course_id, prerequisite_course_id)
