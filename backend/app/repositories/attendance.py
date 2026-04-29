from sqlalchemy.orm import Session
from app.models.attendance import Attendance


class AttendanceRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_student(self, student_id: int) -> list[Attendance]:
        return self.db.query(Attendance).filter(Attendance.student_id == student_id).all()

    def list_by_lesson(self, lesson_id: int) -> list[Attendance]:
        return self.db.query(Attendance).filter(Attendance.lesson_id == lesson_id).all()

    def create(self, attendance: Attendance) -> Attendance:
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        return attendance
