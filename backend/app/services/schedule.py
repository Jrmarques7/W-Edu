from datetime import datetime, timedelta, timezone
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schedule import (
    AttendanceMethod,
    AttendanceRecord,
    AttendanceStatus,
    CheckinToken,
    ClassEnrollment,
    ClassEnrollmentStatus,
    ClassOffering,
    Location,
    Room,
    ScheduledMeeting,
    WaitlistEntry,
)
from app.models.notification import NotificationEventType
from app.repositories.course import CourseRepository
from app.repositories.lesson import LessonRepository
from app.repositories.schedule import (
    AttendanceRecordRepository,
    ClassOfferingRepository,
    CheckinTokenRepository,
    LocationRepository,
    RoomRepository,
    ScheduledMeetingRepository,
)
from app.repositories.student import StudentRepository
from app.services.notification import NotificationService
from app.services.certificate import CertificateService
from app.schemas.schedule import (
    ClassJoinOut,
    ClassOfferingCreate,
    ClassOfferingUpdate,
    LocationCreate,
    LocationUpdate,
    MeetingAttendanceSummary,
    RoomCreate,
    RoomUpdate,
    ScheduledMeetingCreate,
    ScheduledMeetingUpdate,
)


class LocationService:
    def __init__(self, db: Session):
        self.repo = LocationRepository(db)

    def create(self, data: LocationCreate) -> Location:
        return self.repo.create(Location(**data.model_dump()))

    def get_or_404(self, location_id: int) -> Location:
        location = self.repo.get_by_id(location_id)
        if not location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade não encontrada")
        return location

    def list_all(self) -> list[Location]:
        return self.repo.list_all()

    def update(self, location_id: int, data: LocationUpdate) -> Location:
        location = self.get_or_404(location_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(location, field, value)
        return self.repo.update(location)


class RoomService:
    def __init__(self, db: Session):
        self.repo = RoomRepository(db)
        self.location_service = LocationService(db)

    def create(self, data: RoomCreate) -> Room:
        self.location_service.get_or_404(data.location_id)
        return self.repo.create(Room(**data.model_dump()))

    def get_or_404(self, room_id: int) -> Room:
        room = self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala não encontrada")
        return room

    def list_all(self) -> list[Room]:
        return self.repo.list_all()

    def list_by_location(self, location_id: int) -> list[Room]:
        self.location_service.get_or_404(location_id)
        return self.repo.list_by_location(location_id)

    def update(self, room_id: int, data: RoomUpdate) -> Room:
        room = self.get_or_404(room_id)
        payload = data.model_dump(exclude_none=True)
        if "location_id" in payload:
            self.location_service.get_or_404(payload["location_id"])
        for field, value in payload.items():
            setattr(room, field, value)
        return self.repo.update(room)


class ClassOfferingService:
    def __init__(self, db: Session):
        self.repo = ClassOfferingRepository(db)
        self.course_repo = CourseRepository(db)
        self.location_repo = LocationRepository(db)
        self.room_repo = RoomRepository(db)
        self.student_repo = StudentRepository(db)
        self.notification_service = NotificationService(db)

    def create(self, data: ClassOfferingCreate) -> ClassOffering:
        self._validate_refs(data.course_id, data.location_id, data.room_id, data.instructor_id)
        self._validate_dates(data.starts_at, data.ends_at)
        class_offering = self.repo.create(ClassOffering(**data.model_dump()))
        course = self.course_repo.get_by_id(class_offering.course_id)
        if course:
            self.notification_service.publish(
                event_type=NotificationEventType.class_created,
                payload={
                    "course_name": course.name,
                    "class_name": class_offering.name,
                    "starts_at": class_offering.starts_at.isoformat(),
                },
                class_offering_id=class_offering.id,
                course_id=course.id,
            )
        return class_offering

    def get_or_404(self, class_id: int) -> ClassOffering:
        class_offering = self.repo.get_by_id(class_id)
        if not class_offering:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Turma não encontrada")
        return class_offering

    def list_all(self) -> list[ClassOffering]:
        return self.repo.list_all()

    def list_by_course(self, course_id: int) -> list[ClassOffering]:
        if not self.course_repo.get_by_id(course_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return self.repo.list_by_course(course_id)

    def update(self, class_id: int, data: ClassOfferingUpdate) -> ClassOffering:
        class_offering = self.get_or_404(class_id)
        payload = data.model_dump(exclude_none=True)
        course_id = payload.get("course_id", class_offering.course_id)
        location_id = payload.get("location_id", class_offering.location_id)
        room_id = payload.get("room_id", class_offering.room_id)
        instructor_id = payload.get("instructor_id", class_offering.instructor_id)
        starts_at = payload.get("starts_at", class_offering.starts_at)
        ends_at = payload.get("ends_at", class_offering.ends_at)
        self._validate_refs(course_id, location_id, room_id, instructor_id)
        self._validate_dates(starts_at, ends_at)
        for field, value in payload.items():
            setattr(class_offering, field, value)
        return self.repo.update(class_offering)

    def join(self, class_id: int, student_id: int) -> ClassJoinOut:
        class_offering = self.get_or_404(class_id)
        existing_enrollment = self.repo.get_enrollment(class_id, student_id)
        if existing_enrollment:
            return ClassJoinOut(result="enrolled", enrollment=existing_enrollment)
        existing_waitlist = self.repo.get_waitlist_entry(class_id, student_id)
        if existing_waitlist:
            return ClassJoinOut(result="waitlisted", waitlist_entry=existing_waitlist)

        active_count = self.repo.active_enrollment_count(class_id)
        if active_count < class_offering.capacity:
            enrollment = self.repo.create_enrollment(ClassEnrollment(class_offering_id=class_id, student_id=student_id))
            return ClassJoinOut(result="enrolled", enrollment=enrollment)

        entry = self.repo.create_waitlist_entry(
            WaitlistEntry(
                class_offering_id=class_id,
                student_id=student_id,
                position=self.repo.next_waitlist_position(class_id),
            )
        )
        return ClassJoinOut(result="waitlisted", waitlist_entry=entry)

    def list_enrollments(self, class_id: int) -> list[ClassEnrollment]:
        self.get_or_404(class_id)
        return self.repo.list_enrollments(class_id)

    def list_waitlist(self, class_id: int) -> list[WaitlistEntry]:
        self.get_or_404(class_id)
        return self.repo.list_waitlist(class_id)

    def _validate_refs(
        self,
        course_id: int,
        location_id: int | None,
        room_id: int | None,
        instructor_id: int | None,
    ) -> None:
        if not self.course_repo.get_by_id(course_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        if location_id and not self.location_repo.get_by_id(location_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade não encontrada")
        room = self.room_repo.get_by_id(room_id) if room_id else None
        if room_id and not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala não encontrada")
        if room and location_id and room.location_id != location_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sala não pertence à unidade")
        if instructor_id and not self.student_repo.get_by_id(instructor_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instrutor não encontrado")

    def _validate_dates(self, starts_at, ends_at) -> None:
        if ends_at <= starts_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fim deve ser posterior ao início")


class ScheduledMeetingService:
    def __init__(self, db: Session):
        self.repo = ScheduledMeetingRepository(db)
        self.class_service = ClassOfferingService(db)
        self.lesson_repo = LessonRepository(db)
        self.room_repo = RoomRepository(db)
        self.certificate_service = CertificateService(db)
        self.notification_service = NotificationService(db)

    def create(self, data: ScheduledMeetingCreate) -> ScheduledMeeting:
        class_offering = self.class_service.get_or_404(data.class_offering_id)
        self._validate_refs(class_offering.id, data.lesson_id, data.room_id)
        self.class_service._validate_dates(data.starts_at, data.ends_at)
        meeting = self.repo.create(ScheduledMeeting(**data.model_dump()))
        course = self.class_service.course_repo.get_by_id(class_offering.course_id)
        if course:
            self.notification_service.publish(
                event_type=NotificationEventType.meeting_created,
                payload={
                    "meeting_title": meeting.title,
                    "starts_at": meeting.starts_at.isoformat(),
                    "course_name": course.name,
                },
                scheduled_meeting_id=meeting.id,
                course_id=course.id,
                class_offering_id=class_offering.id,
            )
            self._schedule_reminder(meeting, class_offering.name, course.name, class_offering.course_id)
        return meeting

    def get_or_404(self, meeting_id: int) -> ScheduledMeeting:
        meeting = self.repo.get_by_id(meeting_id)
        if not meeting:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Encontro não encontrado")
        return meeting

    def list_by_class(self, class_id: int) -> list[ScheduledMeeting]:
        self.class_service.get_or_404(class_id)
        return self.repo.list_by_class(class_id)

    def update(self, meeting_id: int, data: ScheduledMeetingUpdate) -> ScheduledMeeting:
        meeting = self.get_or_404(meeting_id)
        payload = data.model_dump(exclude_none=True)
        lesson_id = payload.get("lesson_id", meeting.lesson_id)
        room_id = payload.get("room_id", meeting.room_id)
        starts_at = payload.get("starts_at", meeting.starts_at)
        ends_at = payload.get("ends_at", meeting.ends_at)
        self._validate_refs(meeting.class_offering_id, lesson_id, room_id)
        self.class_service._validate_dates(starts_at, ends_at)
        for field, value in payload.items():
            setattr(meeting, field, value)
        return self.repo.update(meeting)

    def close_meeting(self, meeting_id: int) -> ScheduledMeeting:
        meeting = self.get_or_404(meeting_id)
        if meeting.is_closed:
            return meeting
        self._mark_absences(meeting)
        meeting.is_closed = True
        meeting.closed_at = datetime.now(timezone.utc)
        meeting = self.repo.update(meeting)
        self._auto_issue_for_meeting(meeting)
        return meeting

    def attendance_summary(self, meeting_id: int) -> MeetingAttendanceSummary:
        meeting = self.get_or_404(meeting_id)
        records = self.repo.db.query(AttendanceRecord).filter(AttendanceRecord.scheduled_meeting_id == meeting_id).all()
        enrolled = self.repo.list_active_enrollments(meeting.class_offering_id)
        present = sum(1 for record in records if record.status == AttendanceStatus.present)
        late = sum(1 for record in records if record.status == AttendanceStatus.late)
        absent = sum(1 for record in records if record.status == AttendanceStatus.absent)
        return MeetingAttendanceSummary(
            meeting_id=meeting.id,
            class_offering_id=meeting.class_offering_id,
            total_enrolled=len(enrolled),
            present=present,
            late=late,
            absent=absent,
            recorded=len(records),
        )

    def _validate_refs(self, class_id: int, lesson_id: int | None, room_id: int | None) -> None:
        class_offering = self.class_service.get_or_404(class_id)
        if lesson_id:
            lesson = self.lesson_repo.get_by_id(lesson_id)
            if not lesson:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aula não encontrada")
            if lesson.course_id != class_offering.course_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aula não pertence ao curso da turma")
        if room_id and not self.room_repo.get_by_id(room_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala não encontrada")

    def _schedule_reminder(self, meeting: ScheduledMeeting, class_name: str, course_name: str, course_id: int) -> None:
        reminder_at = meeting.starts_at - timedelta(hours=24)
        if reminder_at <= datetime.now(timezone.utc):
            return
        self.notification_service.publish(
            event_type=NotificationEventType.meeting_reminder,
            payload={
                "meeting_title": meeting.title,
                "starts_at": meeting.starts_at.isoformat(),
                "class_name": class_name,
                "course_name": course_name,
            },
            course_id=course_id,
            class_offering_id=meeting.class_offering_id,
            scheduled_meeting_id=meeting.id,
            scheduled_for=reminder_at,
        )

    def _mark_absences(self, meeting: ScheduledMeeting) -> None:
        enrolled = self.repo.list_active_enrollments(meeting.class_offering_id)
        class_offering = self.class_service.get_or_404(meeting.class_offering_id)
        course = self.class_service.course_repo.get_by_id(class_offering.course_id)
        for enrollment in enrolled:
            existing = self.repo.db.query(AttendanceRecord).filter(
                AttendanceRecord.scheduled_meeting_id == meeting.id,
                AttendanceRecord.student_id == enrollment.student_id,
            ).first()
            if existing:
                continue
            self.repo.db.add(
                AttendanceRecord(
                    scheduled_meeting_id=meeting.id,
                    class_offering_id=meeting.class_offering_id,
                    student_id=enrollment.student_id,
                    status=AttendanceStatus.absent,
                    method=AttendanceMethod.manual,
                    notes="Falta registrada automaticamente ao encerrar encontro",
                )
            )
            if course:
                self.notification_service.publish(
                    event_type=NotificationEventType.absence_registered,
                    payload={
                        "student_name": enrollment.student.name if enrollment.student else f"Aluno #{enrollment.student_id}",
                        "meeting_title": meeting.title,
                        "course_name": course.name,
                    },
                    recipient_student_id=enrollment.student_id,
                    course_id=course.id,
                    class_offering_id=meeting.class_offering_id,
                    scheduled_meeting_id=meeting.id,
                )
        self.repo.db.commit()

    def _auto_issue_for_meeting(self, meeting: ScheduledMeeting) -> None:
        enrollments = self.repo.list_active_enrollments(meeting.class_offering_id)
        course_id = self.class_service.get_or_404(meeting.class_offering_id).course_id
        for enrollment in enrollments:
            self.certificate_service.auto_issue(course_id, enrollment.student_id)


class AttendanceRecordService:
    def __init__(self, db: Session):
        self.record_repo = AttendanceRecordRepository(db)
        self.token_repo = CheckinTokenRepository(db)
        self.class_repo = ClassOfferingRepository(db)
        self.meeting_service = ScheduledMeetingService(db)
        self.student_repo = StudentRepository(db)
        self.certificate_service = CertificateService(db)
        self.notification_service = NotificationService(db)

    def generate_checkin_token(self, meeting_id: int, valid_minutes: int) -> CheckinToken:
        self.meeting_service.get_or_404(meeting_id)
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=valid_minutes)
        return self.token_repo.create(
            CheckinToken(scheduled_meeting_id=meeting_id, token=token, expires_at=expires_at)
        )

    def list_tokens(self, meeting_id: int) -> list[CheckinToken]:
        self.meeting_service.get_or_404(meeting_id)
        return self.token_repo.list_by_meeting(meeting_id)

    def check_in_with_token(self, token: str, student_id: int) -> AttendanceRecord:
        checkin_token = self.token_repo.get_by_token(token)
        now = datetime.now(timezone.utc)
        if not checkin_token or not checkin_token.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Token de check-in inválido")
        if checkin_token.expires_at < now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token de check-in expirado")

        meeting = self.meeting_service.get_or_404(checkin_token.scheduled_meeting_id)
        enrollment = self.class_repo.get_enrollment(meeting.class_offering_id, student_id)
        if not enrollment or enrollment.status != ClassEnrollmentStatus.active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Aluno não inscrito nesta turma")

        status_value = AttendanceStatus.late if now > meeting.starts_at + timedelta(minutes=15) else AttendanceStatus.present
        return self._upsert_record(
            meeting,
            student_id,
            status_value,
            AttendanceMethod.qr_code,
            None,
        )

    def create_manual_record(self, meeting_id: int, student_id: int, status_value, method, notes: str | None) -> AttendanceRecord:
        meeting = self.meeting_service.get_or_404(meeting_id)
        if not self.student_repo.get_by_id(student_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        return self._upsert_record(meeting, student_id, status_value, method, notes)

    def list_by_meeting(self, meeting_id: int) -> list[AttendanceRecord]:
        self.meeting_service.get_or_404(meeting_id)
        return self.record_repo.list_by_meeting(meeting_id)

    def _upsert_record(
        self,
        meeting: ScheduledMeeting,
        student_id: int,
        status_value: AttendanceStatus,
        method: AttendanceMethod,
        notes: str | None,
    ) -> AttendanceRecord:
        existing = self.record_repo.get_by_meeting_and_student(meeting.id, student_id)
        if existing:
            existing.status = status_value
            existing.method = method
            existing.notes = notes
            existing.recorded_at = datetime.now(timezone.utc)
            record = self.record_repo.update(existing)
        else:
            record = self.record_repo.create(
                AttendanceRecord(
                    scheduled_meeting_id=meeting.id,
                    class_offering_id=meeting.class_offering_id,
                    student_id=student_id,
                    status=status_value,
                    method=method,
                    notes=notes,
                )
            )
        course_id = self.class_service.get_or_404(meeting.class_offering_id).course_id
        self.certificate_service.auto_issue(course_id, student_id)
        self.notification_service.publish(
            event_type=NotificationEventType.attendance_recorded,
            payload={
                "student_name": f"Aluno #{student_id}",
                "meeting_title": meeting.title,
            },
            recipient_student_id=student_id,
            course_id=course_id,
            class_offering_id=meeting.class_offering_id,
            scheduled_meeting_id=meeting.id,
        )
        return record
