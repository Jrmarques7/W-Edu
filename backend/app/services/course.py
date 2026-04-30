from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.course import Course, CourseModule, CoursePrerequisite, LearningPath, LearningPathCourse
from app.repositories.course import (
    CourseModuleRepository,
    CoursePrerequisiteRepository,
    CourseRepository,
    LearningPathRepository,
)
from app.schemas.course import (
    CourseCreate,
    CourseModuleCreate,
    CourseModuleUpdate,
    CoursePrerequisiteCreate,
    CourseUpdate,
    LearningPathCourseCreate,
    LearningPathCreate,
    LearningPathUpdate,
)


class CourseService:
    def __init__(self, db: Session):
        self.repo = CourseRepository(db)

    def create(self, data: CourseCreate) -> Course:
        course = Course(**data.model_dump())
        return self.repo.create(course)

    def get_or_404(self, course_id: int) -> Course:
        course = self.repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return course

    def list_all(self) -> list[Course]:
        return self.repo.list_all()

    def update(self, course_id: int, data: CourseUpdate) -> Course:
        course = self.get_or_404(course_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(course, field, value)
        return self.repo.update(course)

    def delete(self, course_id: int) -> None:
        course = self.get_or_404(course_id)
        self.repo.delete(course)


class CourseModuleService:
    def __init__(self, db: Session):
        self.repo = CourseModuleRepository(db)
        self.course_service = CourseService(db)

    def create(self, data: CourseModuleCreate) -> CourseModule:
        if data.course_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curso é obrigatório")
        self.course_service.get_or_404(data.course_id)
        module = CourseModule(**data.model_dump())
        return self.repo.create(module)

    def get_or_404(self, module_id: int) -> CourseModule:
        module = self.repo.get_by_id(module_id)
        if not module:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Módulo não encontrado")
        return module

    def list_by_course(self, course_id: int) -> list[CourseModule]:
        self.course_service.get_or_404(course_id)
        return self.repo.list_by_course(course_id)

    def update(self, module_id: int, data: CourseModuleUpdate) -> CourseModule:
        module = self.get_or_404(module_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(module, field, value)
        return self.repo.update(module)

    def delete(self, module_id: int) -> None:
        module = self.get_or_404(module_id)
        self.repo.delete(module)


class LearningPathService:
    def __init__(self, db: Session):
        self.repo = LearningPathRepository(db)
        self.course_service = CourseService(db)

    def create(self, data: LearningPathCreate) -> LearningPath:
        path = LearningPath(**data.model_dump())
        return self.repo.create(path)

    def get_or_404(self, path_id: int) -> LearningPath:
        path = self.repo.get_by_id(path_id)
        if not path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trilha não encontrada")
        return path

    def list_all(self) -> list[LearningPath]:
        return self.repo.list_all()

    def update(self, path_id: int, data: LearningPathUpdate) -> LearningPath:
        path = self.get_or_404(path_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(path, field, value)
        return self.repo.update(path)

    def delete(self, path_id: int) -> None:
        path = self.get_or_404(path_id)
        self.repo.delete(path)

    def add_course(self, path_id: int, data: LearningPathCourseCreate) -> LearningPathCourse:
        self.get_or_404(path_id)
        self.course_service.get_or_404(data.course_id)
        existing = self.repo.get_course_link(path_id, data.course_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Curso já está na trilha")
        return self.repo.add_course(LearningPathCourse(learning_path_id=path_id, **data.model_dump()))

    def list_courses(self, path_id: int) -> list[LearningPathCourse]:
        self.get_or_404(path_id)
        return self.repo.list_courses(path_id)

    def remove_course(self, path_id: int, course_id: int) -> None:
        link = self.repo.get_course_link(path_id, course_id)
        if not link:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não está na trilha")
        self.repo.remove_course(link)


class CoursePrerequisiteService:
    def __init__(self, db: Session):
        self.repo = CoursePrerequisiteRepository(db)
        self.course_service = CourseService(db)

    def list_by_course(self, course_id: int) -> list[CoursePrerequisite]:
        self.course_service.get_or_404(course_id)
        return self.repo.list_by_course(course_id)

    def create(self, course_id: int, data: CoursePrerequisiteCreate) -> CoursePrerequisite:
        if course_id == data.prerequisite_course_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Curso não pode ser pré-requisito dele mesmo")
        self.course_service.get_or_404(course_id)
        self.course_service.get_or_404(data.prerequisite_course_id)
        existing = self.repo.get_link(course_id, data.prerequisite_course_id)
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Pré-requisito já cadastrado")
        return self.repo.create(CoursePrerequisite(course_id=course_id, **data.model_dump()))

    def delete(self, course_id: int, prerequisite_course_id: int) -> None:
        link = self.repo.get_link(course_id, prerequisite_course_id)
        if not link:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pré-requisito não encontrado")
        self.repo.delete(link)
