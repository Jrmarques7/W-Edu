from pathlib import Path
import re
import shutil
import uuid

from fastapi import UploadFile

from app.core.config import settings


def documents_storage_dir() -> Path:
    path = Path(settings.DOCUMENTS_STORAGE_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sanitize_filename(filename: str) -> str:
    stem = Path(filename).stem
    suffix = Path(filename).suffix.lower()
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-") or "document"
    return f"{safe_stem}{suffix}"


def store_uploaded_document(document_id: int, version_number: int, upload: UploadFile) -> tuple[str, int]:
    base_dir = documents_storage_dir() / str(document_id)
    base_dir.mkdir(parents=True, exist_ok=True)
    safe_name = _sanitize_filename(upload.filename or "document")
    unique_name = f"v{version_number}_{uuid.uuid4().hex}_{safe_name}"
    target_path = base_dir / unique_name
    with target_path.open("wb") as handle:
        shutil.copyfileobj(upload.file, handle)
    size = target_path.stat().st_size
    return str(target_path), size
