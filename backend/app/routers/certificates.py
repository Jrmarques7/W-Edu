from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin, get_current_student
from app.models.student import Student
from app.schemas.certificate import (
    CertificateEligibilityOut,
    CertificateIssueOut,
    CertificateOut,
    CertificateRevokeIn,
    CertificateRuleOut,
    CertificateRuleUpdate,
    CertificateValidationOut,
)
from app.services.certificate import CertificateService

router = APIRouter()


@router.get("/rules/{course_id}", response_model=CertificateRuleOut)
def get_rule(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return CertificateService(db).get_rule(course_id)


@router.patch("/rules/{course_id}", response_model=CertificateRuleOut)
def update_rule(
    course_id: int,
    data: CertificateRuleUpdate,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return CertificateService(db).update_rule(course_id, data)


@router.get("/courses/{course_id}/students/{student_id}/eligibility", response_model=CertificateEligibilityOut)
def check_eligibility(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return CertificateService(db).evaluate(course_id, student_id)


@router.post("/courses/{course_id}/students/{student_id}/issue", response_model=CertificateIssueOut)
def issue_certificate(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin),
):
    certificate = CertificateService(db).issue(course_id, student_id, issued_by_id=current.id)
    return CertificateIssueOut(issued=True, certificate_id=certificate.id, validation_code=certificate.validation_code)


@router.get("/courses/{course_id}/certificates", response_model=list[CertificateOut])
def list_course_certificates(course_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return CertificateService(db).list_by_course(course_id)


@router.post("/{certificate_id}/revoke", response_model=CertificateOut)
def revoke_certificate(
    certificate_id: int,
    data: CertificateRevokeIn,
    db: Session = Depends(get_db),
    _: Student = Depends(get_current_admin),
):
    return CertificateService(db).revoke(certificate_id, data.reason)


@router.get("/students/me", response_model=list[CertificateOut])
def my_certificates(db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return CertificateService(db).list_by_student(current.id)


@router.get("/students/{student_id}", response_model=list[CertificateOut])
def list_student_certificates(student_id: int, db: Session = Depends(get_db), _: Student = Depends(get_current_admin)):
    return CertificateService(db).list_by_student(student_id)


@router.get("/validate/{code}", response_model=CertificateValidationOut)
def validate_certificate(code: str, db: Session = Depends(get_db)):
    valid, certificate, message = CertificateService(db).validate_code(code)
    return CertificateValidationOut(valid=valid, certificate=certificate, message=message)
