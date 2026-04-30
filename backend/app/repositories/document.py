from sqlalchemy.orm import Session

from app.models.document import Document, DocumentVersion


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, document_id: int) -> Document | None:
        return self.db.get(Document, document_id)

    def list_all(self) -> list[Document]:
        return self.db.query(Document).order_by(Document.created_at.desc()).all()

    def create(self, document: Document) -> Document:
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def update(self, document: Document) -> Document:
        self.db.commit()
        self.db.refresh(document)
        return document


class DocumentVersionRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, version_id: int) -> DocumentVersion | None:
        return self.db.get(DocumentVersion, version_id)

    def list_by_document(self, document_id: int) -> list[DocumentVersion]:
        return (
            self.db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
            .all()
        )

    def get_latest_by_document(self, document_id: int) -> DocumentVersion | None:
        return (
            self.db.query(DocumentVersion)
            .filter(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_number.desc())
            .first()
        )

    def create(self, version: DocumentVersion) -> DocumentVersion:
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version
