from datetime import datetime, timezone
import enum
from sqlalchemy import ForeignKey, Integer, String, Text, DateTime, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CourseModality(str, enum.Enum):
    online = "online"
    in_person = "in_person"
    hybrid = "hybrid"


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    modality: Mapped[CourseModality] = mapped_column(SAEnum(CourseModality), default=CourseModality.online)
    # ID do agente professor no W-Matrix
    agent_id: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    modules: Mapped[list["CourseModule"]] = relationship(
        back_populates="course",
        order_by="CourseModule.order",
        cascade="all, delete-orphan",
    )
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", order_by="Lesson.order")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="course")
    path_links: Mapped[list["LearningPathCourse"]] = relationship(back_populates="course", cascade="all, delete-orphan")
    prerequisites: Mapped[list["CoursePrerequisite"]] = relationship(
        back_populates="course",
        foreign_keys="CoursePrerequisite.course_id",
        cascade="all, delete-orphan",
    )
    required_by: Mapped[list["CoursePrerequisite"]] = relationship(
        back_populates="prerequisite_course",
        foreign_keys="CoursePrerequisite.prerequisite_course_id",
        cascade="all, delete-orphan",
    )


class CourseModule(Base):
    __tablename__ = "course_modules"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    course: Mapped["Course"] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="module", order_by="Lesson.order")


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    courses: Mapped[list["LearningPathCourse"]] = relationship(
        back_populates="learning_path",
        order_by="LearningPathCourse.order",
        cascade="all, delete-orphan",
    )


class LearningPathCourse(Base):
    __tablename__ = "learning_path_courses"
    __table_args__ = (UniqueConstraint("learning_path_id", "course_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    learning_path_id: Mapped[int] = mapped_column(ForeignKey("learning_paths.id"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    learning_path: Mapped["LearningPath"] = relationship(back_populates="courses")
    course: Mapped["Course"] = relationship(back_populates="path_links")


class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"
    __table_args__ = (UniqueConstraint("course_id", "prerequisite_course_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    prerequisite_course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)

    course: Mapped["Course"] = relationship(
        back_populates="prerequisites",
        foreign_keys=[course_id],
    )
    prerequisite_course: Mapped["Course"] = relationship(
        back_populates="required_by",
        foreign_keys=[prerequisite_course_id],
    )
