from datetime import datetime, timedelta, timezone
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schedule import AttendanceMethod, AttendanceRecord, AttendanceStatus, CheckinToken, ClassEnrollmentStatus
from app.repositories.schedule import AttendanceRecordRepository, CheckinTokenRepository, ClassOfferingRepository
from app.repositories.student import StudentRepository
from app.services.certificate import CertificateService
from app.services.notification import NotificationService
from app.models.notification import NotificationEventType
from .meeting import ScheduledMeetingService


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
        return self.token_repo.create(CheckinToken(scheduled_meeting_id=meeting_id, token=token, expires_at=expires_at))

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
        return self._upsert_record(meeting, student_id, status_value, AttendanceMethod.qr_code, None)

    def create_manual_record(self, meeting_id: int, student_id: int, status_value, method, notes: str | None) -> AttendanceRecord:
        meeting = self.meeting_service.get_or_404(meeting_id)
        if not self.student_repo.get_by_id(student_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aluno não encontrado")
        return self._upsert_record(meeting, student_id, status_value, method, notes)

    def list_by_meeting(self, meeting_id: int) -> list[AttendanceRecord]:
        self.meeting_service.get_or_404(meeting_id)
        return self.record_repo.list_by_meeting(meeting_id)

    def _upsert_record(self, meeting, student_id: int, status_value: AttendanceStatus, method: AttendanceMethod, notes: str | None) -> AttendanceRecord:
        existing = self.record_repo.get_by_meeting_and_student(meeting.id, student_id)
        if existing:
            existing.status = status_value
            existing.method = method
            existing.notes = notes
            existing.recorded_at = datetime.now(timezone.utc)
            record = self.record_repo.update(existing)
        else:
            record = self.record_repo.create(AttendanceRecord(
                scheduled_meeting_id=meeting.id, class_offering_id=meeting.class_offering_id,
                student_id=student_id, status=status_value, method=method, notes=notes,
            ))
        course_id = self.meeting_service.class_service.get_or_404(meeting.class_offering_id).course_id
        self.certificate_service.auto_issue(course_id, student_id)
        self.notification_service.publish(
            event_type=NotificationEventType.attendance_recorded,
            payload={"student_name": f"Aluno #{student_id}", "meeting_title": meeting.title},
            recipient_student_id=student_id, course_id=course_id,
            class_offering_id=meeting.class_offering_id, scheduled_meeting_id=meeting.id,
        )
        return record
