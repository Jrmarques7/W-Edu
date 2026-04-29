from datetime import datetime, timezone
import enum
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.student)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")
    progress: Mapped[list["Progress"]] = relationship(back_populates="student")
    sessions: Mapped[list["Session"]] = relationship(back_populates="student")
    attendance: Mapped[list["Attendance"]] = relationship(back_populates="student")
