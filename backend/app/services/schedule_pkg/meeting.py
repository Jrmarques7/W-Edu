from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import NotificationEventType
from app.models.schedule import AttendanceMethod, AttendanceRecord, AttendanceStatus, ClassOffering, ScheduledMeeting
from app.repositories.lesson import LessonRepository
from app.repositories.schedule import RoomRepository, ScheduledMeetingRepository
from app.schemas.schedule import MeetingAttendanceSummary, ScheduledMeetingCreate, ScheduledMeetingUpdate
from app.services.certificate import CertificateService
from app.services.notification import NotificationService
from .class_offering import ClassOfferingService


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
        self._validate_schedule_conflicts(
            class_offering=class_offering,
            room_id=data.room_id,
            starts_at=data.starts_at,
            ends_at=data.ends_at,
        )
        meeting = self.repo.create(ScheduledMeeting(**data.model_dump()))
        course = self.class_service.course_repo.get_by_id(class_offering.course_id)
        if course:
            self.notification_service.publish(
                event_type=NotificationEventType.meeting_created,
                payload={"meeting_title": meeting.title, "starts_at": meeting.starts_at.isoformat(), "course_name": course.name},
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
        self._validate_refs(
            meeting.class_offering_id,
            payload.get("lesson_id", meeting.lesson_id),
            payload.get("room_id", meeting.room_id),
        )
        starts_at = payload.get("starts_at", meeting.starts_at)
        ends_at = payload.get("ends_at", meeting.ends_at)
        room_id = payload.get("room_id", meeting.room_id)
        self.class_service._validate_dates(starts_at, ends_at)
        self._validate_schedule_conflicts(
            class_offering=self.class_service.get_or_404(meeting.class_offering_id),
            room_id=room_id,
            starts_at=starts_at,
            ends_at=ends_at,
            exclude_meeting_id=meeting.id,
        )
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
        present = sum(1 for r in records if r.status == AttendanceStatus.present)
        late = sum(1 for r in records if r.status == AttendanceStatus.late)
        absent = sum(1 for r in records if r.status == AttendanceStatus.absent)
        return MeetingAttendanceSummary(
            meeting_id=meeting.id, class_offering_id=meeting.class_offering_id,
            total_enrolled=len(enrolled), present=present, late=late, absent=absent, recorded=len(records),
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

    def _validate_schedule_conflicts(
        self,
        *,
        class_offering: ClassOffering,
        room_id: int | None,
        starts_at: datetime,
        ends_at: datetime,
        exclude_meeting_id: int | None = None,
    ) -> None:
        if room_id:
            room_query = self.repo.db.query(ScheduledMeeting).filter(
                ScheduledMeeting.room_id == room_id,
                ScheduledMeeting.starts_at < ends_at,
                ScheduledMeeting.ends_at > starts_at,
            )
            if exclude_meeting_id:
                room_query = room_query.filter(ScheduledMeeting.id != exclude_meeting_id)
            if room_query.first():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Sala já possui encontro agendado neste horário",
                )

        if class_offering.instructor_id:
            instructor_query = (
                self.repo.db.query(ScheduledMeeting)
                .join(ClassOffering, ClassOffering.id == ScheduledMeeting.class_offering_id)
                .filter(
                    ClassOffering.instructor_id == class_offering.instructor_id,
                    ScheduledMeeting.starts_at < ends_at,
                    ScheduledMeeting.ends_at > starts_at,
                )
            )
            if exclude_meeting_id:
                instructor_query = instructor_query.filter(ScheduledMeeting.id != exclude_meeting_id)
            if instructor_query.first():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Instrutor já possui encontro agendado neste horário",
                )

    def _schedule_reminder(self, meeting: ScheduledMeeting, class_name: str, course_name: str, course_id: int) -> None:
        reminder_at = meeting.starts_at - timedelta(hours=24)
        if reminder_at <= datetime.now(timezone.utc):
            return
        self.notification_service.publish(
            event_type=NotificationEventType.meeting_reminder,
            payload={"meeting_title": meeting.title, "starts_at": meeting.starts_at.isoformat(), "class_name": class_name, "course_name": course_name},
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
            self.repo.db.add(AttendanceRecord(
                scheduled_meeting_id=meeting.id, class_offering_id=meeting.class_offering_id,
                student_id=enrollment.student_id, status=AttendanceStatus.absent,
                method=AttendanceMethod.manual, notes="Falta registrada automaticamente ao encerrar encontro",
            ))
            if course:
                self.notification_service.publish(
                    event_type=NotificationEventType.absence_registered,
                    payload={"student_name": enrollment.student.name if enrollment.student else f"Aluno #{enrollment.student_id}", "meeting_title": meeting.title, "course_name": course.name},
                    recipient_student_id=enrollment.student_id, course_id=course.id,
                    class_offering_id=meeting.class_offering_id, scheduled_meeting_id=meeting.id,
                )
        self.repo.db.commit()

    def _auto_issue_for_meeting(self, meeting: ScheduledMeeting) -> None:
        enrollments = self.repo.list_active_enrollments(meeting.class_offering_id)
        course_id = self.class_service.get_or_404(meeting.class_offering_id).course_id
        for enrollment in enrollments:
            self.certificate_service.auto_issue(course_id, enrollment.student_id)
