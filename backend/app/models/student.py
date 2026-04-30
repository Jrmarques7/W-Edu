from datetime import datetime, timezone
import enum
from sqlalchemy import ForeignKey, String, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    instructor = "instructor"
    coordinator = "coordinator"
    company_manager = "company_manager"
    admin = "admin"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    legal_name: Mapped[str | None] = mapped_column(String(200))
    document: Mapped[str | None] = mapped_column(String(50), index=True)
    contact_email: Mapped[str | None] = mapped_column(String(200))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    users: Mapped[list["Student"]] = relationship(back_populates="organization")
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="organization")
    charges: Mapped[list["Charge"]] = relationship(back_populates="organization")


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.student)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), nullable=True, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    organization: Mapped["Organization | None"] = relationship(back_populates="users")
    student_profile: Mapped["StudentProfile | None"] = relationship(back_populates="student", uselist=False, cascade="all, delete-orphan")
    instructor_profile: Mapped["InstructorProfile | None"] = relationship(back_populates="student", uselist=False, cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(back_populates="student")
    progress: Mapped[list["Progress"]] = relationship(back_populates="student")
    sessions: Mapped[list["Session"]] = relationship(back_populates="student")
    attendance: Mapped[list["Attendance"]] = relationship(back_populates="student")
    quiz_attempts: Mapped[list["QuizAttempt"]] = relationship(back_populates="student")
    certificates: Mapped[list["Certificate"]] = relationship(back_populates="student", cascade="all, delete-orphan")
    issued_certificates: Mapped[list["Certificate"]] = relationship(
        back_populates="issued_by",
        foreign_keys="Certificate.issued_by_id",
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="student")
    charges: Mapped[list["Charge"]] = relationship(back_populates="student")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50))
    document: Mapped[str | None] = mapped_column(String(50), index=True)
    position: Mapped[str | None] = mapped_column(String(120))
    department: Mapped[str | None] = mapped_column(String(120))
    bio: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped["Student"] = relationship(back_populates="student_profile")


class InstructorProfile(Base):
    __tablename__ = "instructor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), unique=True, index=True)
    specialties: Mapped[str | None] = mapped_column(Text)
    bio: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[str | None] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student: Mapped["Student"] = relationship(back_populates="instructor_profile")
    availability_slots: Mapped[list["InstructorAvailability"]] = relationship(back_populates="instructor_profile", cascade="all, delete-orphan")
    ratings: Mapped[list["InstructorRating"]] = relationship(back_populates="instructor_profile", cascade="all, delete-orphan")


class InstructorAvailability(Base):
    __tablename__ = "instructor_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    instructor_profile_id: Mapped[int] = mapped_column(ForeignKey("instructor_profiles.id"), index=True)
    day_of_week: Mapped[int] = mapped_column()
    start_time: Mapped[str] = mapped_column(String(5))
    end_time: Mapped[str] = mapped_column(String(5))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    instructor_profile: Mapped["InstructorProfile"] = relationship(back_populates="availability_slots")


class InstructorRating(Base):
    __tablename__ = "instructor_ratings"
    __table_args__ = ()

    id: Mapped[int] = mapped_column(primary_key=True)
    instructor_profile_id: Mapped[int] = mapped_column(ForeignKey("instructor_profiles.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    score: Mapped[int] = mapped_column()
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    instructor_profile: Mapped["InstructorProfile"] = relationship(back_populates="ratings")
    student: Mapped["Student"] = relationship()
