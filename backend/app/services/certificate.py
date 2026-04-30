from datetime import datetime, timezone
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import Course, CourseCompletionRule, CourseModality
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress, ProgressStatus
from app.models.quiz import QuizAttempt
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering, ScheduledMeeting
from app.models.student import Student
from app.repositories.certificate import CertificateRepository, CourseCompletionRuleRepository
from app.repositories.course import CourseRepository
from app.repositories.lesson import LessonRepository
from app.repositories.student import StudentRepository
from app.schemas.certificate import CertificateEligibilityOut, CertificateRuleUpdate


class CertificateService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CertificateRepository(db)
        self.rule_repo = CourseCompletionRuleRepository(db)
        self.course_repo = CourseRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.student_repo = StudentRepository(db)

    def get_rule(self, course_id: int) -> CourseCompletionRule:
        course = self._get_course_or_404(course_id)
        rule = self.rule_repo.get_by_course(course_id)
        if rule:
            return rule
        return self.rule_repo.create(self._default_rule(course))

    def update_rule(self, course_id: int, data: CertificateRuleUpdate) -> CourseCompletionRule:
        rule = self.get_rule(course_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(rule, field, value)
        return self.rule_repo.update(rule)

    def evaluate(self, course_id: int, student_id: int) -> CertificateEligibilityOut:
        course = self._get_course_or_404(course_id)
        self._get_student_or_404(student_id)
        rule = self.get_rule(course_id)

        reasons: list[str] = []

        enrollment = self.db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.student_id == student_id,
        ).first()
        if not enrollment:
            reasons.append("Aluno não está matriculado no curso")

        lessons = self.lesson_repo.list_by_course(course_id)
        progress_percent = self._progress_percent(student_id, lessons)
        if rule.require_lessons_complete and progress_percent < rule.minimum_progress_percent:
            reasons.append("Progresso insuficiente")

        quiz_percent = self._quiz_percent(student_id, lessons)
        if rule.require_quiz and quiz_percent < rule.minimum_quiz_score:
            reasons.append("Desempenho em avaliações insuficiente")

        attendance_percent = self._attendance_percent(student_id, course_id)
        if rule.require_attendance and attendance_percent < rule.minimum_attendance_percent:
            reasons.append("Frequência insuficiente")

        return CertificateEligibilityOut(
            course_id=course_id,
            student_id=student_id,
            eligible=not reasons,
            progress_percent=progress_percent,
            quiz_percent=quiz_percent,
            attendance_percent=attendance_percent,
            reasons=reasons,
        )

    def issue(self, course_id: int, student_id: int, issued_by_id: int | None = None) -> Certificate:
        evaluation = self.evaluate(course_id, student_id)
        if not evaluation.eligible:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "Aluno não elegível para certificação", "reasons": evaluation.reasons})

        existing = self.repo.get_by_student_and_course(student_id, course_id)
        if existing and existing.revoked_at is None:
            return existing

        if existing:
            existing.validation_code = self._generate_code()
            existing.issued_at = datetime.now(timezone.utc)
            existing.revoked_at = None
            existing.revoked_reason = None
            existing.issued_by_id = issued_by_id
            return self.repo.update(existing)

        certificate = Certificate(
            student_id=student_id,
            course_id=course_id,
            validation_code=self._generate_code(),
            issued_by_id=issued_by_id,
        )
        return self.repo.create(certificate)

    def auto_issue(self, course_id: int, student_id: int) -> Certificate | None:
        try:
            rule = self.get_rule(course_id)
            if not rule.auto_issue:
                return None
            return self.issue(course_id, student_id)
        except HTTPException:
            return None

    def list_by_student(self, student_id: int) -> list[Certificate]:
        self._get_student_or_404(student_id)
        return self.repo.list_by_student(student_id)

    def list_by_course(self, course_id: int) -> list[Certificate]:
        self._get_course_or_404(course_id)
        return self.repo.list_by_course(course_id)

    def validate_code(self, code: str) -> tuple[bool, Certificate | None, str]:
        certificate = self.repo.get_by_code(code)
        if not certificate:
            return False, None, "Certificado não encontrado"
        if certificate.revoked_at is not None:
            return False, certificate, "Certificado revogado"
        return True, certificate, "Certificado válido"

    def revoke(self, certificate_id: int, reason: str | None = None) -> Certificate:
        certificate = self.repo.get_by_id(certificate_id)
        if not certificate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
        certificate.revoked_at = datetime.now(timezone.utc)
        certificate.revoked_reason = reason
        return self.repo.update(certificate)

    def _default_rule(self, course: Course) -> CourseCompletionRule:
        return CourseCompletionRule(
            course_id=course.id,
            require_lessons_complete=True,
            minimum_progress_percent=100,
            require_quiz=True,
            minimum_quiz_score=70,
            require_attendance=course.modality in {CourseModality.in_person, CourseModality.hybrid},
            minimum_attendance_percent=75,
            auto_issue=True,
        )

    def _progress_percent(self, student_id: int, lessons: list[Lesson]) -> int:
        if not lessons:
            return 100
        lesson_ids = {lesson.id for lesson in lessons}
        records = self.db.query(Progress).filter(
            Progress.student_id == student_id,
            Progress.lesson_id.in_(lesson_ids),
        ).all()
        done = sum(1 for record in records if record.status == ProgressStatus.done)
        return round(done / len(lessons) * 100)

    def _quiz_percent(self, student_id: int, lessons: list[Lesson]) -> int:
        quiz_lessons = [lesson for lesson in lessons if lesson.quiz is not None]
        if not quiz_lessons:
            return 100

        passed = 0
        for lesson in quiz_lessons:
            quiz = lesson.quiz
            best_attempt = (
                self.db.query(QuizAttempt)
                .filter(QuizAttempt.student_id == student_id, QuizAttempt.quiz_id == quiz.id)
                .order_by(QuizAttempt.score.desc(), QuizAttempt.attempted_at.desc())
                .first()
            )
            if best_attempt and best_attempt.passed:
                passed += 1
        return round(passed / len(quiz_lessons) * 100)

    def _attendance_percent(self, student_id: int, course_id: int) -> int:
        class_offering_ids = [
            row[0]
            for row in self.db.query(ClassOffering.id)
            .join(ClassEnrollment, ClassEnrollment.class_offering_id == ClassOffering.id)
            .filter(
                ClassOffering.course_id == course_id,
                ClassEnrollment.student_id == student_id,
                ClassEnrollment.status == ClassEnrollmentStatus.active,
            )
            .distinct()
            .all()
        ]
        if not class_offering_ids:
            return 0

        meeting_ids = [
            row[0]
            for row in self.db.query(ScheduledMeeting.id)
            .filter(
                ScheduledMeeting.class_offering_id.in_(class_offering_ids),
                ScheduledMeeting.is_closed.is_(True),
            )
            .all()
        ]
        if not meeting_ids:
            return 0

        records = self.db.query(AttendanceRecord).filter(
            AttendanceRecord.scheduled_meeting_id.in_(meeting_ids),
            AttendanceRecord.student_id == student_id,
        ).all()
        attended = sum(1 for record in records if record.status in {AttendanceStatus.present, AttendanceStatus.late})
        return round(attended / len(meeting_ids) * 100)

    def _generate_code(self) -> str:
        return secrets.token_urlsafe(12).replace("-", "").replace("_", "")

    def _get_course_or_404(self, course_id: int) -> Course:
        course = self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return course

    def _get_student_or_404(self, student_id: int) -> Student:
        student = self.student_repo.get_by_id(student_id)
        if not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
        return student
