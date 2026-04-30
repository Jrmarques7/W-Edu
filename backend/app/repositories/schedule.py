from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.schedule import (
    AttendanceRecord,
    ClassEnrollment,
    ClassEnrollmentStatus,
    ClassOffering,
    CheckinToken,
    Location,
    Room,
    ScheduledMeeting,
    WaitlistEntry,
)


class LocationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, location_id: int) -> Location | None:
        return self.db.get(Location, location_id)

    def list_all(self) -> list[Location]:
        return self.db.query(Location).order_by(Location.name).all()

    def create(self, location: Location) -> Location:
        self.db.add(location)
        self.db.commit()
        self.db.refresh(location)
        return location

    def update(self, location: Location) -> Location:
        self.db.commit()
        self.db.refresh(location)
        return location


class RoomRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, room_id: int) -> Room | None:
        return self.db.get(Room, room_id)

    def list_all(self) -> list[Room]:
        return self.db.query(Room).order_by(Room.name).all()

    def list_by_location(self, location_id: int) -> list[Room]:
        return self.db.query(Room).filter(Room.location_id == location_id).order_by(Room.name).all()

    def create(self, room: Room) -> Room:
        self.db.add(room)
        self.db.commit()
        self.db.refresh(room)
        return room

    def update(self, room: Room) -> Room:
        self.db.commit()
        self.db.refresh(room)
        return room


class ClassOfferingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, class_id: int) -> ClassOffering | None:
        return self.db.get(ClassOffering, class_id)

    def list_all(self) -> list[ClassOffering]:
        return self.db.query(ClassOffering).order_by(ClassOffering.starts_at.desc()).all()

    def list_by_course(self, course_id: int) -> list[ClassOffering]:
        return (
            self.db.query(ClassOffering)
            .filter(ClassOffering.course_id == course_id)
            .order_by(ClassOffering.starts_at.desc())
            .all()
        )

    def create(self, class_offering: ClassOffering) -> ClassOffering:
        self.db.add(class_offering)
        self.db.commit()
        self.db.refresh(class_offering)
        return class_offering

    def update(self, class_offering: ClassOffering) -> ClassOffering:
        self.db.commit()
        self.db.refresh(class_offering)
        return class_offering

    def active_enrollment_count(self, class_id: int) -> int:
        return (
            self.db.query(func.count(ClassEnrollment.id))
            .filter(
                ClassEnrollment.class_offering_id == class_id,
                ClassEnrollment.status == ClassEnrollmentStatus.active,
            )
            .scalar()
            or 0
        )

    def get_enrollment(self, class_id: int, student_id: int) -> ClassEnrollment | None:
        return (
            self.db.query(ClassEnrollment)
            .filter(ClassEnrollment.class_offering_id == class_id, ClassEnrollment.student_id == student_id)
            .first()
        )

    def create_enrollment(self, enrollment: ClassEnrollment) -> ClassEnrollment:
        self.db.add(enrollment)
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment

    def get_waitlist_entry(self, class_id: int, student_id: int) -> WaitlistEntry | None:
        return (
            self.db.query(WaitlistEntry)
            .filter(WaitlistEntry.class_offering_id == class_id, WaitlistEntry.student_id == student_id)
            .first()
        )

    def next_waitlist_position(self, class_id: int) -> int:
        current = (
            self.db.query(func.max(WaitlistEntry.position))
            .filter(WaitlistEntry.class_offering_id == class_id)
            .scalar()
            or 0
        )
        return current + 1

    def create_waitlist_entry(self, entry: WaitlistEntry) -> WaitlistEntry:
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def list_enrollments(self, class_id: int) -> list[ClassEnrollment]:
        return (
            self.db.query(ClassEnrollment)
            .filter(ClassEnrollment.class_offering_id == class_id)
            .order_by(ClassEnrollment.enrolled_at)
            .all()
        )

    def list_waitlist(self, class_id: int) -> list[WaitlistEntry]:
        return (
            self.db.query(WaitlistEntry)
            .filter(WaitlistEntry.class_offering_id == class_id)
            .order_by(WaitlistEntry.position)
            .all()
        )


class ScheduledMeetingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, meeting_id: int) -> ScheduledMeeting | None:
        return self.db.get(ScheduledMeeting, meeting_id)

    def list_by_class(self, class_id: int) -> list[ScheduledMeeting]:
        return (
            self.db.query(ScheduledMeeting)
            .filter(ScheduledMeeting.class_offering_id == class_id)
            .order_by(ScheduledMeeting.starts_at)
            .all()
        )

    def create(self, meeting: ScheduledMeeting) -> ScheduledMeeting:
        self.db.add(meeting)
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def update(self, meeting: ScheduledMeeting) -> ScheduledMeeting:
        self.db.commit()
        self.db.refresh(meeting)
        return meeting

    def list_active_enrollments(self, class_id: int) -> list[ClassEnrollment]:
        return (
            self.db.query(ClassEnrollment)
            .filter(
                ClassEnrollment.class_offering_id == class_id,
                ClassEnrollment.status == ClassEnrollmentStatus.active,
            )
            .all()
        )


class AttendanceRecordRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_meeting_and_student(self, meeting_id: int, student_id: int) -> AttendanceRecord | None:
        return (
            self.db.query(AttendanceRecord)
            .filter(AttendanceRecord.scheduled_meeting_id == meeting_id, AttendanceRecord.student_id == student_id)
            .first()
        )

    def list_by_meeting(self, meeting_id: int) -> list[AttendanceRecord]:
        return (
            self.db.query(AttendanceRecord)
            .filter(AttendanceRecord.scheduled_meeting_id == meeting_id)
            .order_by(AttendanceRecord.recorded_at)
            .all()
        )

    def create(self, record: AttendanceRecord) -> AttendanceRecord:
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def update(self, record: AttendanceRecord) -> AttendanceRecord:
        self.db.commit()
        self.db.refresh(record)
        return record


class CheckinTokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_token(self, token: str) -> CheckinToken | None:
        return self.db.query(CheckinToken).filter(CheckinToken.token == token).first()

    def list_by_meeting(self, meeting_id: int) -> list[CheckinToken]:
        return (
            self.db.query(CheckinToken)
            .filter(CheckinToken.scheduled_meeting_id == meeting_id)
            .order_by(CheckinToken.created_at.desc())
            .all()
        )

    def create(self, token: CheckinToken) -> CheckinToken:
        self.db.add(token)
        self.db.commit()
        self.db.refresh(token)
        return token
