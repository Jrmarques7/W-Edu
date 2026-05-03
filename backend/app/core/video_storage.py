from pathlib import Path
import re
import uuid

from fastapi import UploadFile

from app.core.config import settings

MIME_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".mkv": "video/x-matroska",
}

CHUNK_SIZE = 1024 * 1024  # 1 MB


def videos_storage_dir() -> Path:
    path = Path(settings.VIDEOS_STORAGE_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sanitize_filename(filename: str) -> str:
    stem = Path(filename).stem
    suffix = Path(filename).suffix.lower()
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-") or "video"
    return f"{safe_stem}{suffix}"


def store_uploaded_video(lesson_id: int, upload: UploadFile) -> str:
    base_dir = videos_storage_dir() / str(lesson_id)
    base_dir.mkdir(parents=True, exist_ok=True)
    safe_name = _sanitize_filename(upload.filename or "video.mp4")
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    target_path = base_dir / unique_name
    with target_path.open("wb") as handle:
        while chunk := upload.file.read(CHUNK_SIZE):
            handle.write(chunk)
    return str(target_path)


def delete_video_file(file_path: str) -> None:
    path = Path(file_path)
    if path.exists():
        path.unlink()


def get_mime_type(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()
    return MIME_TYPES.get(suffix, "video/mp4")
