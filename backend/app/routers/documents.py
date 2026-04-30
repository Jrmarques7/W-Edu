from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin_or_company_manager
from app.models.student import Student
from app.schemas.document import (
    DocumentCreate,
    DocumentOut,
    DocumentUpdate,
    DocumentVersionCreate,
    DocumentVersionOut,
)
from app.services.document import DocumentService

router = APIRouter()


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return DocumentService(db).list_documents(current)


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return DocumentService(db).get_document(document_id, current)


@router.post("", response_model=DocumentOut, status_code=201)
def create_document(
    title: str = Form(...),
    document_type: str = Form("other"),
    description: str | None = Form(None),
    status: str = Form("draft"),
    course_id: int | None = Form(None),
    class_offering_id: int | None = Form(None),
    organization_id: int | None = Form(None),
    student_id: int | None = Form(None),
    external_reference: str | None = Form(None),
    version_notes: str | None = Form(None),
    external_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_company_manager),
):
    data = DocumentCreate(
        title=title,
        document_type=document_type,
        description=description,
        status=status,
        course_id=course_id,
        class_offering_id=class_offering_id,
        organization_id=organization_id,
        student_id=student_id,
        external_reference=external_reference,
    )
    version_data = DocumentVersionCreate(notes=version_notes, external_url=external_url)
    return DocumentService(db).create_document(data, current, file=file, version_data=version_data)


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    data: DocumentUpdate,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_company_manager),
):
    return DocumentService(db).update_document(document_id, data, current)


@router.get("/{document_id}/versions", response_model=list[DocumentVersionOut])
def list_versions(document_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return DocumentService(db).list_versions(document_id, current)


@router.post("/{document_id}/versions", response_model=DocumentVersionOut, status_code=201)
def add_version(
    document_id: int,
    version_notes: str | None = Form(None),
    external_url: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_company_manager),
):
    version_data = DocumentVersionCreate(notes=version_notes, external_url=external_url)
    return DocumentService(db).add_version(document_id, current, file=file, version_data=version_data)


@router.get("/{document_id}/download")
def download_latest(
    document_id: int,
    version_id: int | None = None,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_company_manager),
):
    return DocumentService(db).download(document_id, version_id, current)


@router.get("/{document_id}/versions/{version_id}/download")
def download_version(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current: Student = Depends(get_current_admin_or_company_manager),
):
    return DocumentService(db).download(document_id, version_id, current)
