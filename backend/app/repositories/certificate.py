from sqlalchemy.orm import Session

from app.models.certificate import Certificate
from app.models.course import CourseCompletionRule


class CertificateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, certificate_id: int) -> Certificate | None:
        return self.db.get(Certificate, certificate_id)

    def get_by_code(self, code: str) -> Certificate | None:
        return self.db.query(Certificate).filter(Certificate.validation_code == code).first()

    def get_by_student_and_course(self, student_id: int, course_id: int) -> Certificate | None:
        return (
            self.db.query(Certificate)
            .filter(Certificate.student_id == student_id, Certificate.course_id == course_id)
            .first()
        )

    def list_by_student(self, student_id: int) -> list[Certificate]:
        return (
            self.db.query(Certificate)
            .filter(Certificate.student_id == student_id)
            .order_by(Certificate.issued_at.desc())
            .all()
        )

    def list_by_course(self, course_id: int) -> list[Certificate]:
        return (
            self.db.query(Certificate)
            .filter(Certificate.course_id == course_id)
            .order_by(Certificate.issued_at.desc())
            .all()
        )

    def create(self, certificate: Certificate) -> Certificate:
        self.db.add(certificate)
        self.db.commit()
        self.db.refresh(certificate)
        return certificate

    def update(self, certificate: Certificate) -> Certificate:
        self.db.commit()
        self.db.refresh(certificate)
        return certificate


class CourseCompletionRuleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_course(self, course_id: int) -> CourseCompletionRule | None:
        return self.db.query(CourseCompletionRule).filter(CourseCompletionRule.course_id == course_id).first()

    def create(self, rule: CourseCompletionRule) -> CourseCompletionRule:
        self.db.add(rule)
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def update(self, rule: CourseCompletionRule) -> CourseCompletionRule:
        self.db.commit()
        self.db.refresh(rule)
        return rule
