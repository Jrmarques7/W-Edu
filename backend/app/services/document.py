from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.storage import store_uploaded_document
from app.models.document import Document, DocumentVersion
from app.models.student import Student, UserRole
from app.repositories.document import DocumentRepository, DocumentVersionRepository
from app.repositories.student import StudentRepository
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentVersionCreate


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DocumentRepository(db)
        self.version_repo = DocumentVersionRepository(db)
        self.student_repo = StudentRepository(db)

    def list_documents(self, current: Student) -> list[Document]:
        documents = self.repo.list_all()
        return [document for document in documents if self._can_access(current, document)]

    def get_document(self, document_id: int, current: Student) -> Document:
        document = self.repo.get_by_id(document_id)
        if not document or not self._can_access(current, document):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado")
        return document

    def create_document(
        self,
        data: DocumentCreate,
        current: Student,
        file: UploadFile | None = None,
        version_data: DocumentVersionCreate | None = None,
    ) -> Document:
        self._validate_scope(data, current)
        document = Document(**data.model_dump())
        if current.role == UserRole.company_manager and document.organization_id is None:
            document.organization_id = current.organization_id
        document.uploaded_by_id = current.id
        document = self.repo.create(document)
        if file or (version_data and version_data.external_url):
            self._add_version(document, current, file=file, version_data=version_data)
        return self.repo.get_by_id(document.id) or document

    def update_document(self, document_id: int, data: DocumentUpdate, current: Student) -> Document:
        document = self.get_document(document_id, current)
        payload = data.model_dump(exclude_none=True)
        merged = DocumentCreate(
            title=payload.get("title", document.title),
            document_type=payload.get("document_type", document.document_type),
            description=payload.get("description", document.description),
            status=payload.get("status", document.status),
            course_id=payload.get("course_id", document.course_id),
            class_offering_id=payload.get("class_offering_id", document.class_offering_id),
            organization_id=payload.get("organization_id", document.organization_id),
            student_id=payload.get("student_id", document.student_id),
            external_reference=payload.get("external_reference", document.external_reference),
        )
        self._validate_scope(merged, current)
        for field, value in payload.items():
            setattr(document, field, value)
        if current.role == UserRole.company_manager and document.organization_id is None:
            document.organization_id = current.organization_id
        return self.repo.update(document)

    def add_version(
        self,
        document_id: int,
        current: Student,
        file: UploadFile | None = None,
        version_data: DocumentVersionCreate | None = None,
    ) -> DocumentVersion:
        document = self.get_document(document_id, current)
        return self._add_version(document, current, file=file, version_data=version_data)

    def list_versions(self, document_id: int, current: Student) -> list[DocumentVersion]:
        document = self.get_document(document_id, current)
        return self.version_repo.list_by_document(document.id)

    def download(self, document_id: int, version_id: int | None, current: Student):
        document = self.get_document(document_id, current)
        version = self._resolve_version(document, version_id)
        return self._download_version(version)

    def _add_version(
        self,
        document: Document,
        current: Student,
        *,
        file: UploadFile | None = None,
        version_data: DocumentVersionCreate | None = None,
    ) -> DocumentVersion:
        if file is None and not (version_data and version_data.external_url):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo ou URL externa são obrigatórios")

        next_version = (document.latest_version_number or 0) + 1
        storage_path = None
        file_name = None
        mime_type = None
        file_size = None
        external_url = version_data.external_url if version_data else None

        if file is not None:
            storage_path, file_size = store_uploaded_document(document.id, next_version, file)
            file_name = file.filename
            mime_type = file.content_type

        version = self.version_repo.create(
            DocumentVersion(
                document_id=document.id,
                version_number=next_version,
                file_name=file_name,
                mime_type=mime_type,
                file_size=file_size,
                storage_path=storage_path,
                external_url=external_url,
                notes=version_data.notes if version_data else None,
                created_by_id=current.id,
            )
        )
        document.latest_version_number = version.version_number
        document.updated_at = datetime.now(timezone.utc)
        self.repo.update(document)
        return version

    def _resolve_version(self, document: Document, version_id: int | None) -> DocumentVersion:
        if version_id is not None:
            version = self.version_repo.get_by_id(version_id)
            if not version or version.document_id != document.id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Versão não encontrada")
            return version
        version = self.version_repo.get_latest_by_document(document.id)
        if not version:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento sem versões")
        return version

    def _download_version(self, version: DocumentVersion):
        if version.external_url:
            return RedirectResponse(version.external_url)
        if not version.storage_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo indisponível")
        path = Path(version.storage_path)
        if not path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo não encontrado")
        return FileResponse(path, filename=version.file_name or path.name, media_type=version.mime_type or "application/octet-stream")

    def _can_access(self, current: Student, document: Document) -> bool:
        if current.role == UserRole.admin:
            return True
        if current.role == UserRole.company_manager:
            if current.organization_id is None:
                return False
            if document.organization_id not in (None, current.organization_id):
                return False
            if document.student_id:
                student = self.student_repo.get_by_id(document.student_id)
                if student and student.organization_id not in (None, current.organization_id):
                    return False
            return True
        return document.student_id == current.id

    def _validate_scope(self, data: DocumentCreate, current: Student) -> None:
        if current.role == UserRole.admin:
            return
        if current.role == UserRole.company_manager:
            if current.organization_id is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Gestor sem empresa vinculada")
            if data.organization_id and data.organization_id != current.organization_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Documento fora da empresa")
            if data.student_id:
                student = self.student_repo.get_by_id(data.student_id)
                if not student or student.organization_id != current.organization_id:
                    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Aluno fora da empresa")
            return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem permissão para criar documentos")
