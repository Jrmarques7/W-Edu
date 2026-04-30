from datetime import datetime
from pydantic import BaseModel, Field

from app.models.document import DocumentStatus, DocumentType


class DocumentCreate(BaseModel):
    title: str
    document_type: DocumentType = DocumentType.other
    description: str | None = None
    status: DocumentStatus = DocumentStatus.draft
    course_id: int | None = None
    class_offering_id: int | None = None
    organization_id: int | None = None
    student_id: int | None = None
    external_reference: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    document_type: DocumentType | None = None
    description: str | None = None
    status: DocumentStatus | None = None
    course_id: int | None = None
    class_offering_id: int | None = None
    organization_id: int | None = None
    student_id: int | None = None
    external_reference: str | None = None
    is_signed: bool | None = None
    signed_at: datetime | None = None
    signed_by: str | None = None


class DocumentVersionCreate(BaseModel):
    notes: str | None = None
    external_url: str | None = None


class DocumentVersionOut(BaseModel):
    id: int
    document_id: int
    version_number: int
    file_name: str | None
    mime_type: str | None
    file_size: int | None
    external_url: str | None
    notes: str | None
    created_by_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    title: str
    document_type: DocumentType
    description: str | None
    status: DocumentStatus
    course_id: int | None
    class_offering_id: int | None
    organization_id: int | None
    student_id: int | None
    uploaded_by_id: int | None
    latest_version_number: int
    is_signed: bool
    signed_at: datetime | None
    signed_by: str | None
    external_reference: str | None
    created_at: datetime
    updated_at: datetime
    versions: list[DocumentVersionOut] = Field(default_factory=list)

    model_config = {"from_attributes": True}
