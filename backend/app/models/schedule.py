from datetime import datetime, timezone
import enum

from sqlalchemy import Boolean, DateTime, Enum as SAEnum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ClassStatus(str, enum.Enum):
    draft = "draft"
    open = "open"
    closed = "closed"
    completed = "completed"
    cancelled = "cancelled"


class ClassEnrollmentStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    completed = "completed"


class MeetingType(str, enum.Enum):
    in_person = "in_person"
    live = "live"
    hybrid = "hybrid"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    late = "late"
    absent = "absent"


class AttendanceMethod(str, enum.Enum):
    manual = "manual"
    qr_code = "qr_code"
    webhook = "webhook"
    biometric = "biometric"
    facial = "facial"


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    address: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    rooms: Mapped[list["Room"]] = relationship(back_populates="location", cascade="all, delete-orphan")
    class_offerings: Mapped[list["ClassOffering"]] = relationship(back_populates="location")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(primary_key=True)
    location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    capacity: Mapped[int] = mapped_column(Integer)
    resources: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    location: Mapped["Location"] = relationship(back_populates="rooms")
    class_offerings: Mapped[list["ClassOffering"]] = relationship(back_populates="room")
    scheduled_meetings: Mapped[list["ScheduledMeeting"]] = relationship(back_populates="room")


class ClassOffering(Base):
    __tablename__ = "class_offerings"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    capacity: Mapped[int] = mapped_column(Integer)
    status: Mapped[ClassStatus] = mapped_column(SAEnum(ClassStatus), default=ClassStatus.draft)
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"), nullable=True, index=True)
    room_id: Mapped[int | None] = mapped_column(ForeignKey("rooms.id"), nullable=True, index=True)
    instructor_id: Mapped[int | None] = mapped_column(ForeignKey("students.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    course: Mapped["Course"] = relationship()
    location: Mapped["Location | None"] = relationship(back_populates="class_offerings")
    room: Mapped["Room | None"] = relationship(back_populates="class_offerings")
    instructor: Mapped["Student | None"] = relationship()
    enrollments: Mapped[list["ClassEnrollment"]] = relationship(back_populates="class_offering", cascade="all, delete-orphan")
    waitlist_entries: Mapped[list["WaitlistEntry"]] = relationship(back_populates="class_offering", cascade="all, delete-orphan")
    scheduled_meetings: Mapped[list["ScheduledMeeting"]] = relationship(back_populates="class_offering", cascade="all, delete-orphan")
    charges: Mapped[list["Charge"]] = relationship(back_populates="class_offering")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    __table_args__ = (UniqueConstraint("class_offering_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    class_offering_id: Mapped[int] = mapped_column(ForeignKey("class_offerings.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    status: Mapped[ClassEnrollmentStatus] = mapped_column(
        SAEnum(ClassEnrollmentStatus),
        default=ClassEnrollmentStatus.active,
    )
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    class_offering: Mapped["ClassOffering"] = relationship(back_populates="enrollments")
    student: Mapped["Student"] = relationship()


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (UniqueConstraint("class_offering_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    class_offering_id: Mapped[int] = mapped_column(ForeignKey("class_offerings.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    class_offering: Mapped["ClassOffering"] = relationship(back_populates="waitlist_entries")
    student: Mapped["Student"] = relationship()


class ScheduledMeeting(Base):
    __tablename__ = "scheduled_meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    class_offering_id: Mapped[int] = mapped_column(ForeignKey("class_offerings.id"), index=True)
    lesson_id: Mapped[int | None] = mapped_column(ForeignKey("lessons.id"), nullable=True, index=True)
    room_id: Mapped[int | None] = mapped_column(ForeignKey("rooms.id"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    type: Mapped[MeetingType] = mapped_column(SAEnum(MeetingType), default=MeetingType.in_person)
    meeting_url: Mapped[str | None] = mapped_column(String(500))
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    class_offering: Mapped["ClassOffering"] = relationship(back_populates="scheduled_meetings")
    lesson: Mapped["Lesson | None"] = relationship()
    room: Mapped["Room | None"] = relationship(back_populates="scheduled_meetings")
    attendance_records: Mapped[list["AttendanceRecord"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    checkin_tokens: Mapped[list["CheckinToken"]] = relationship(back_populates="meeting", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("scheduled_meeting_id", "student_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    scheduled_meeting_id: Mapped[int] = mapped_column(ForeignKey("scheduled_meetings.id"), index=True)
    class_offering_id: Mapped[int] = mapped_column(ForeignKey("class_offerings.id"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    status: Mapped[AttendanceStatus] = mapped_column(SAEnum(AttendanceStatus), default=AttendanceStatus.present)
    method: Mapped[AttendanceMethod] = mapped_column(SAEnum(AttendanceMethod), default=AttendanceMethod.manual)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes: Mapped[str | None] = mapped_column(Text)

    meeting: Mapped["ScheduledMeeting"] = relationship(back_populates="attendance_records")
    class_offering: Mapped["ClassOffering"] = relationship()
    student: Mapped["Student"] = relationship()


class CheckinToken(Base):
    __tablename__ = "checkin_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheduled_meeting_id: Mapped[int] = mapped_column(ForeignKey("scheduled_meetings.id"), index=True)
    token: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    meeting: Mapped["ScheduledMeeting"] = relationship(back_populates="checkin_tokens")
