from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.quiz import Quiz, QuizAttempt
from app.models.lesson import Lesson
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering
from app.models.student import Student, UserRole


class AnalyticsBase:
    def __init__(self, db: Session):
        self.db = db

    def _rate(self, value: int, total: int) -> int:
        if total == 0:
            return 0
        return round(value / total * 100)

    def _organization_scope(self, current: Student | None) -> int | None:
        if current and current.role == UserRole.company_manager:
            return current.organization_id
        return None

    def _attendance_rate_for_meetings(self, meeting_ids: list[int], organization_id: int | None = None) -> int:
        if not meeting_ids:
            return 0
        total_q = self.db.query(AttendanceRecord).filter(AttendanceRecord.scheduled_meeting_id.in_(meeting_ids))
        attended_q = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.scheduled_meeting_id.in_(meeting_ids),
            AttendanceRecord.status.in_([AttendanceStatus.present, AttendanceStatus.late]),
        )
        if organization_id is not None:
            total_q = total_q.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
            attended_q = attended_q.join(Student, Student.id == AttendanceRecord.student_id).filter(Student.organization_id == organization_id)
        total = total_q.count()
        return self._rate(attended_q.count(), total)

    def _average_best_quiz_score(self, course_id: int, organization_id: int | None = None, student_ids: list[int] | None = None) -> int:
        quiz_ids = [row[0] for row in self.db.query(Quiz.id).join(Lesson, Quiz.lesson_id == Lesson.id).filter(Lesson.course_id == course_id).all()]
        if not quiz_ids:
            return 0
        query = self.db.query(QuizAttempt.student_id, func.max(QuizAttempt.score)).filter(QuizAttempt.quiz_id.in_(quiz_ids))
        if student_ids is not None:
            if not student_ids:
                return 0
            query = query.filter(QuizAttempt.student_id.in_(student_ids))
        if organization_id is not None:
            query = query.join(Student, Student.id == QuizAttempt.student_id).filter(Student.organization_id == organization_id)
        best_scores = query.group_by(QuizAttempt.student_id).all()
        if not best_scores:
            return 0
        return round(sum(score for _, score in best_scores) / len(best_scores))

    def _class_ids_for_course(self, course_id: int, organization_id: int | None) -> list[int]:
        query = self.db.query(ClassOffering.id).filter(ClassOffering.course_id == course_id)
        if organization_id is not None:
            query = (
                query.join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id)
                .join(Student, Student.id == ClassEnrollment.student_id)
                .filter(Student.organization_id == organization_id)
                .distinct()
            )
        return [row[0] for row in query.all()]
