from datetime import datetime, timezone
import hashlib
import hmac
from pathlib import Path
import secrets
import unicodedata

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.storage import certificates_storage_dir
from app.core.config import settings
from app.models.assignment import AssignmentSubmission, AssignmentSubmissionStatus
from app.models.certificate import Certificate
from app.models.course import Course, CourseCompletionRule, CourseModality
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson, LessonType
from app.models.progress import Progress, ProgressStatus
from app.models.quiz import QuizAttempt
from app.models.schedule import AttendanceRecord, AttendanceStatus, ClassEnrollment, ClassEnrollmentStatus, ClassOffering, ScheduledMeeting
from app.models.schedule import PracticalAssessmentRecord, PracticalAssessmentStatus
from app.models.student import Student
from app.repositories.certificate import CertificateRepository, CourseCompletionRuleRepository
from app.repositories.course import CourseRepository
from app.repositories.lesson import LessonRepository
from app.services.notification import NotificationService
from app.models.notification import NotificationEventType
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
        self.notification_service = NotificationService(db)

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

        quiz_percent = self._quiz_percent(student_id, lessons, rule.minimum_quiz_score)
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
            certificate = self.repo.update(existing)
        else:
            certificate = self.repo.create(
                Certificate(
                    student_id=student_id,
                    course_id=course_id,
                    validation_code=self._generate_code(),
                    issued_by_id=issued_by_id,
                )
            )

        course = self.course_repo.get_by_id(course_id)
        student = self.student_repo.get_by_id(student_id)
        if course and student:
            certificate = self.ensure_signature(certificate)
            self.ensure_pdf(certificate)
            self.notification_service.publish(
                event_type=NotificationEventType.certificate_issued,
                payload={
                    "course_name": course.name,
                    "student_name": student.name,
                    "certificate_code": certificate.validation_code,
                },
                recipient_student_id=student_id,
                course_id=course_id,
            )
        return certificate

    def get_for_download(self, certificate_id: int, current: Student) -> Certificate:
        certificate = self.repo.get_by_id(certificate_id)
        if not certificate:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificado não encontrado")
        if current.role not in {"admin", "coordinator"} and certificate.student_id != current.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito ao titular do certificado")
        if certificate.revoked_at is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Certificado revogado")
        self._prepare_existing_certificate(certificate)
        return certificate

    def ensure_pdf(self, certificate: Certificate) -> Certificate:
        if certificate.pdf_url and Path(certificate.pdf_url).exists():
            return certificate
        course = certificate.course or self.course_repo.get_by_id(certificate.course_id)
        student = certificate.student or self.student_repo.get_by_id(certificate.student_id)
        if not course or not student:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dados do certificado incompletos")

        target = certificates_storage_dir() / f"certificate_{certificate.id}_{certificate.validation_code}.pdf"
        target.write_bytes(
            self._render_certificate_pdf(
                student_name=student.name,
                course_name=course.name,
                issued_at=certificate.issued_at,
                validation_code=certificate.validation_code,
            )
        )
        certificate.pdf_url = str(target)
        return self.repo.update(certificate)

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
        if not certificate.signature_hash and not certificate.signature_algorithm:
            self.ensure_signature(certificate)
        if not self.verify_signature(certificate):
            return False, certificate, "Assinatura digital inválida"
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

    def _quiz_percent(self, student_id: int, lessons: list[Lesson], minimum_score: int) -> int:
        assessment_lessons = [
            lesson
            for lesson in lessons
            if lesson.quiz is not None or lesson.type == LessonType.assessment
        ]
        if not assessment_lessons:
            return 100

        passed = 0
        for lesson in assessment_lessons:
            quiz = lesson.quiz
            quiz_passed = False
            if quiz:
                best_attempt = (
                    self.db.query(QuizAttempt)
                    .filter(QuizAttempt.student_id == student_id, QuizAttempt.quiz_id == quiz.id)
                    .order_by(QuizAttempt.score.desc(), QuizAttempt.attempted_at.desc())
                    .first()
                )
                quiz_passed = bool(best_attempt and best_attempt.passed)

            submission_passed = False
            if lesson.type == LessonType.assessment:
                submission = (
                    self.db.query(AssignmentSubmission)
                    .filter(
                        AssignmentSubmission.lesson_id == lesson.id,
                        AssignmentSubmission.student_id == student_id,
                        AssignmentSubmission.status == AssignmentSubmissionStatus.reviewed,
                    )
                    .order_by(AssignmentSubmission.reviewed_at.desc().nullslast(), AssignmentSubmission.submitted_at.desc())
                    .first()
                )
                submission_passed = bool(submission and submission.score is not None and submission.score >= minimum_score)

            practical_passed = False
            if lesson.type == LessonType.assessment:
                practical = (
                    self.db.query(PracticalAssessmentRecord)
                    .join(ScheduledMeeting, ScheduledMeeting.id == PracticalAssessmentRecord.scheduled_meeting_id)
                    .filter(
                        ScheduledMeeting.lesson_id == lesson.id,
                        PracticalAssessmentRecord.student_id == student_id,
                        PracticalAssessmentRecord.status == PracticalAssessmentStatus.reviewed,
                    )
                    .order_by(PracticalAssessmentRecord.score.desc(), PracticalAssessmentRecord.recorded_at.desc())
                    .first()
                )
                practical_passed = bool(practical and practical.score >= minimum_score)

            if quiz_passed or submission_passed or practical_passed:
                passed += 1
        return round(passed / len(assessment_lessons) * 100)

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

    def ensure_signature(self, certificate: Certificate) -> Certificate:
        expected = self._signature_hash(certificate)
        if certificate.signature_hash == expected and certificate.signature_algorithm == "HMAC-SHA256":
            return certificate
        if certificate.signature_hash or certificate.signature_algorithm:
            return certificate
        certificate.signature_algorithm = "HMAC-SHA256"
        certificate.signature_hash = expected
        certificate.signed_at = datetime.now(timezone.utc)
        return self.repo.update(certificate)

    def verify_signature(self, certificate: Certificate) -> bool:
        if not certificate.signature_hash:
            return False
        return hmac.compare_digest(certificate.signature_hash, self._signature_hash(certificate))

    def _prepare_existing_certificate(self, certificate: Certificate) -> Certificate:
        if not certificate.signature_hash and not certificate.signature_algorithm:
            certificate = self.ensure_signature(certificate)
        if not self.verify_signature(certificate):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assinatura digital inválida")
        self.ensure_pdf(certificate)
        return certificate

    def _signature_hash(self, certificate: Certificate) -> str:
        payload = "|".join(
            [
                str(certificate.id),
                str(certificate.student_id),
                str(certificate.course_id),
                certificate.validation_code,
                certificate.issued_at.isoformat(),
            ]
        )
        return hmac.new(settings.SECRET_KEY.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()

    def _render_certificate_pdf(
        self,
        *,
        student_name: str,
        course_name: str,
        issued_at: datetime,
        validation_code: str,
    ) -> bytes:
        lines = [
            "CERTIFICADO",
            "Certificamos que",
            student_name,
            "concluiu o curso",
            course_name,
            f"Emitido em {issued_at.strftime('%d/%m/%Y')}",
            f"Codigo de validacao: {validation_code}",
            "Assinado digitalmente por W-Edu",
        ]
        stream_lines = [
            "BT",
            "/F1 26 Tf",
            "72 750 Td",
            f"({self._pdf_text(lines[0])}) Tj",
            "/F1 13 Tf",
            "0 -54 Td",
        ]
        for line in lines[1:]:
            stream_lines.append(f"({self._pdf_text(line)}) Tj")
            stream_lines.append("0 -32 Td")
        stream_lines.append("ET")
        stream = "\n".join(stream_lines).encode("ascii")

        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
        ]
        body = bytearray(b"%PDF-1.4\n")
        offsets: list[int] = []
        for index, obj in enumerate(objects, start=1):
            offsets.append(len(body))
            body.extend(f"{index} 0 obj\n".encode("ascii"))
            body.extend(obj)
            body.extend(b"\nendobj\n")
        xref_offset = len(body)
        body.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
        body.extend(b"0000000000 65535 f \n")
        for offset in offsets:
            body.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
        body.extend(
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("ascii")
        )
        return bytes(body)

    def _pdf_text(self, value: str) -> str:
        normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
        return normalized.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

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
