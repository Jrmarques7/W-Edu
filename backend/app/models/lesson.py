from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.core.database import Base


class LessonType(str, enum.Enum):
    text = "text"
    video = "video"
    pdf = "pdf"
    live = "live"
    in_person = "in_person"
    voice = "voice"
    assessment = "assessment"


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    module_id: Mapped[int | None] = mapped_column(ForeignKey("course_modules.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    content: Mapped[str | None] = mapped_column(Text)
    order: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[LessonType] = mapped_column(SAEnum(LessonType), default=LessonType.text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    course: Mapped["Course"] = relationship(back_populates="lessons")
    module: Mapped["CourseModule | None"] = relationship(back_populates="lessons")
    progress: Mapped[list["Progress"]] = relationship(back_populates="lesson")
    sessions: Mapped[list["Session"]] = relationship(back_populates="lesson")
    attendance: Mapped[list["Attendance"]] = relationship(back_populates="lesson")
    quiz: Mapped["Quiz | None"] = relationship(back_populates="lesson", uselist=False)
