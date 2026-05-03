from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.notification import NotificationEventType
from app.models.schedule import ClassEnrollment, ClassOffering, WaitlistEntry
from app.repositories.course import CourseRepository
from app.repositories.schedule import ClassOfferingRepository, LocationRepository, RoomRepository
from app.repositories.student import StudentRepository
from app.schemas.schedule import ClassJoinOut, ClassOfferingCreate, ClassOfferingUpdate
from app.services.notification import NotificationService


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
                payload={"course_name": course.name, "class_name": class_offering.name, "starts_at": class_offering.starts_at.isoformat()},
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
        self._validate_refs(
            payload.get("course_id", class_offering.course_id),
            payload.get("location_id", class_offering.location_id),
            payload.get("room_id", class_offering.room_id),
            payload.get("instructor_id", class_offering.instructor_id),
        )
        self._validate_dates(payload.get("starts_at", class_offering.starts_at), payload.get("ends_at", class_offering.ends_at))
        for field, value in payload.items():
            setattr(class_offering, field, value)
        return self.repo.update(class_offering)

    def join(self, class_id: int, student_id: int) -> ClassJoinOut:
        class_offering = self.get_or_404(class_id)
        if existing := self.repo.get_enrollment(class_id, student_id):
            return ClassJoinOut(result="enrolled", enrollment=existing)
        if existing := self.repo.get_waitlist_entry(class_id, student_id):
            return ClassJoinOut(result="waitlisted", waitlist_entry=existing)
        if self.repo.active_enrollment_count(class_id) < class_offering.capacity:
            enrollment = self.repo.create_enrollment(ClassEnrollment(class_offering_id=class_id, student_id=student_id))
            return ClassJoinOut(result="enrolled", enrollment=enrollment)
        entry = self.repo.create_waitlist_entry(
            WaitlistEntry(class_offering_id=class_id, student_id=student_id, position=self.repo.next_waitlist_position(class_id))
        )
        return ClassJoinOut(result="waitlisted", waitlist_entry=entry)

    def list_enrollments(self, class_id: int) -> list[ClassEnrollment]:
        self.get_or_404(class_id)
        return self.repo.list_enrollments(class_id)

    def list_waitlist(self, class_id: int) -> list[WaitlistEntry]:
        self.get_or_404(class_id)
        return self.repo.list_waitlist(class_id)

    def _validate_refs(self, course_id: int, location_id: int | None, room_id: int | None, instructor_id: int | None) -> None:
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
