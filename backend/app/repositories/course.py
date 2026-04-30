from sqlalchemy.orm import Session
from app.models.course import Course, CourseModule, CoursePrerequisite, LearningPath, LearningPathCourse


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, course_id: int) -> Course | None:
        return self.db.get(Course, course_id)

    def list_all(self) -> list[Course]:
        return self.db.query(Course).all()

    def create(self, course: Course) -> Course:
        self.db.add(course)
        self.db.commit()
        self.db.refresh(course)
        return course

    def update(self, course: Course) -> Course:
        self.db.commit()
        self.db.refresh(course)
        return course

    def delete(self, course: Course) -> None:
        self.db.delete(course)
        self.db.commit()


class CourseModuleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, module_id: int) -> CourseModule | None:
        return self.db.get(CourseModule, module_id)

    def list_by_course(self, course_id: int) -> list[CourseModule]:
        return (
            self.db.query(CourseModule)
            .filter(CourseModule.course_id == course_id)
            .order_by(CourseModule.order)
            .all()
        )

    def create(self, module: CourseModule) -> CourseModule:
        self.db.add(module)
        self.db.commit()
        self.db.refresh(module)
        return module

    def update(self, module: CourseModule) -> CourseModule:
        self.db.commit()
        self.db.refresh(module)
        return module

    def delete(self, module: CourseModule) -> None:
        self.db.delete(module)
        self.db.commit()


class LearningPathRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, path_id: int) -> LearningPath | None:
        return self.db.get(LearningPath, path_id)

    def list_all(self) -> list[LearningPath]:
        return self.db.query(LearningPath).order_by(LearningPath.name).all()

    def create(self, path: LearningPath) -> LearningPath:
        self.db.add(path)
        self.db.commit()
        self.db.refresh(path)
        return path

    def update(self, path: LearningPath) -> LearningPath:
        self.db.commit()
        self.db.refresh(path)
        return path

    def delete(self, path: LearningPath) -> None:
        self.db.delete(path)
        self.db.commit()

    def add_course(self, path_course: LearningPathCourse) -> LearningPathCourse:
        self.db.add(path_course)
        self.db.commit()
        self.db.refresh(path_course)
        return path_course

    def list_courses(self, path_id: int) -> list[LearningPathCourse]:
        return (
            self.db.query(LearningPathCourse)
            .filter(LearningPathCourse.learning_path_id == path_id)
            .order_by(LearningPathCourse.order)
            .all()
        )

    def remove_course(self, link: LearningPathCourse) -> None:
        self.db.delete(link)
        self.db.commit()

    def get_course_link(self, path_id: int, course_id: int) -> LearningPathCourse | None:
        return (
            self.db.query(LearningPathCourse)
            .filter(LearningPathCourse.learning_path_id == path_id, LearningPathCourse.course_id == course_id)
            .first()
        )


class CoursePrerequisiteRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_course(self, course_id: int) -> list[CoursePrerequisite]:
        return (
            self.db.query(CoursePrerequisite)
            .filter(CoursePrerequisite.course_id == course_id)
            .all()
        )

    def create(self, prerequisite: CoursePrerequisite) -> CoursePrerequisite:
        self.db.add(prerequisite)
        self.db.commit()
        self.db.refresh(prerequisite)
        return prerequisite

    def get_link(self, course_id: int, prerequisite_course_id: int) -> CoursePrerequisite | None:
        return (
            self.db.query(CoursePrerequisite)
            .filter(
                CoursePrerequisite.course_id == course_id,
                CoursePrerequisite.prerequisite_course_id == prerequisite_course_id,
            )
            .first()
        )

    def delete(self, prerequisite: CoursePrerequisite) -> None:
        self.db.delete(prerequisite)
        self.db.commit()
