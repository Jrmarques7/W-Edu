from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_student
from app.models.student import Student
from app.schemas.schedule import (
    ClassEnrollmentOut,
    ClassJoinOut,
    ClassOfferingCreate,
    ClassOfferingOut,
    ClassOfferingUpdate,
    AttendanceRecordCreate,
    AttendanceRecordOut,
    CheckinTokenCreate,
    CheckinTokenOut,
    LocationCreate,
    LocationOut,
    LocationUpdate,
    RoomCreate,
    RoomOut,
    RoomUpdate,
    ScheduledMeetingCreate,
    MeetingAttendanceSummary,
    ScheduledMeetingOut,
    ScheduledMeetingUpdate,
    WaitlistEntryOut,
)
from app.services.schedule import AttendanceRecordService, ClassOfferingService, LocationService, RoomService, ScheduledMeetingService

router = APIRouter()


@router.post("/locations", response_model=LocationOut, status_code=201)
def create_location(data: LocationCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return LocationService(db).create(data)


@router.get("/locations", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return LocationService(db).list_all()


@router.patch("/locations/{location_id}", response_model=LocationOut)
def update_location(
    location_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return LocationService(db).update(location_id, data)


@router.post("/rooms", response_model=RoomOut, status_code=201)
def create_room(data: RoomCreate, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return RoomService(db).create(data)


@router.get("/rooms", response_model=list[RoomOut])
def list_rooms(location_id: int | None = None, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    service = RoomService(db)
    if location_id:
        return service.list_by_location(location_id)
    return service.list_all()


@router.patch("/rooms/{room_id}", response_model=RoomOut)
def update_room(
    room_id: int,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return RoomService(db).update(room_id, data)


@router.post("/classes", response_model=ClassOfferingOut, status_code=201)
def create_class(
    data: ClassOfferingCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ClassOfferingService(db).create(data)


@router.get("/classes", response_model=list[ClassOfferingOut])
def list_classes(
    course_id: int | None = None,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_student),
):
    service = ClassOfferingService(db)
    if course_id:
        return service.list_by_course(course_id)
    return service.list_all()


@router.get("/classes/{class_id}", response_model=ClassOfferingOut)
def get_class(class_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_student)):
    return ClassOfferingService(db).get_or_404(class_id)


@router.patch("/classes/{class_id}", response_model=ClassOfferingOut)
def update_class(
    class_id: int,
    data: ClassOfferingUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ClassOfferingService(db).update(class_id, data)


@router.post("/classes/{class_id}/join", response_model=ClassJoinOut)
def join_class(class_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return ClassOfferingService(db).join(class_id, current.id)


@router.get("/classes/{class_id}/enrollments", response_model=list[ClassEnrollmentOut])
def list_class_enrollments(
    class_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ClassOfferingService(db).list_enrollments(class_id)


@router.get("/classes/{class_id}/waitlist", response_model=list[WaitlistEntryOut])
def list_class_waitlist(
    class_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ClassOfferingService(db).list_waitlist(class_id)


@router.post("/meetings", response_model=ScheduledMeetingOut, status_code=201)
def create_meeting(
    data: ScheduledMeetingCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ScheduledMeetingService(db).create(data)


@router.get("/classes/{class_id}/meetings", response_model=list[ScheduledMeetingOut])
def list_class_meetings(
    class_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_student),
):
    return ScheduledMeetingService(db).list_by_class(class_id)


@router.patch("/meetings/{meeting_id}", response_model=ScheduledMeetingOut)
def update_meeting(
    meeting_id: int,
    data: ScheduledMeetingUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ScheduledMeetingService(db).update(meeting_id, data)


@router.post("/meetings/{meeting_id}/close", response_model=ScheduledMeetingOut)
def close_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ScheduledMeetingService(db).close_meeting(meeting_id)


@router.get("/meetings/{meeting_id}/summary", response_model=MeetingAttendanceSummary)
def meeting_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return ScheduledMeetingService(db).attendance_summary(meeting_id)


@router.post("/meetings/{meeting_id}/checkin-tokens", response_model=CheckinTokenOut, status_code=201)
def create_checkin_token(
    meeting_id: int,
    data: CheckinTokenCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return AttendanceRecordService(db).generate_checkin_token(meeting_id, data.valid_minutes)


@router.get("/meetings/{meeting_id}/checkin-tokens", response_model=list[CheckinTokenOut])
def list_checkin_tokens(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return AttendanceRecordService(db).list_tokens(meeting_id)


@router.post("/check-in/{token}", response_model=AttendanceRecordOut)
def check_in(token: str, db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return AttendanceRecordService(db).check_in_with_token(token, current.id)


@router.post("/meetings/{meeting_id}/attendance", response_model=AttendanceRecordOut, status_code=201)
def create_attendance_record(
    meeting_id: int,
    data: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return AttendanceRecordService(db).create_manual_record(
        meeting_id,
        data.student_id,
        data.status,
        data.method,
        data.notes,
    )


@router.get("/meetings/{meeting_id}/attendance", response_model=list[AttendanceRecordOut])
def list_attendance_records(
    meeting_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return AttendanceRecordService(db).list_by_meeting(meeting_id)
