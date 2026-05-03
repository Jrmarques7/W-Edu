from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import Response, StreamingResponse

from app.core.video_storage import CHUNK_SIZE, delete_video_file, get_mime_type, store_uploaded_video
from app.models.lesson import Lesson

ALLOWED_MIME_PREFIXES = ("video/",)


class VideoService:
    def upload(self, lesson: Lesson, upload: UploadFile) -> str:
        if lesson.type.value != "video":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aula não é do tipo vídeo")
        content_type = upload.content_type or ""
        if not any(content_type.startswith(p) for p in ALLOWED_MIME_PREFIXES):
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Arquivo deve ser um vídeo")
        if lesson.video_path:
            delete_video_file(lesson.video_path)
        return store_uploaded_video(lesson.id, upload)

    def delete(self, lesson: Lesson) -> None:
        if not lesson.video_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhum arquivo de vídeo encontrado")
        delete_video_file(lesson.video_path)

    def stream(self, file_path: str, range_header: str | None) -> Response:
        path = Path(file_path)
        if not path.exists():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo de vídeo não encontrado")
        file_size = path.stat().st_size
        mime = get_mime_type(file_path)

        if range_header:
            start_str, _, end_str = range_header.replace("bytes=", "").partition("-")
            range_start = int(start_str)
            range_end = int(end_str) if end_str else file_size - 1
            range_end = min(range_end, file_size - 1)
            content_length = range_end - range_start + 1

            def _generate_partial():
                with open(file_path, "rb") as f:
                    f.seek(range_start)
                    remaining = content_length
                    while remaining > 0:
                        data = f.read(min(CHUNK_SIZE, remaining))
                        if not data:
                            break
                        remaining -= len(data)
                        yield data

            return StreamingResponse(
                _generate_partial(),
                status_code=206,
                media_type=mime,
                headers={
                    "Content-Range": f"bytes {range_start}-{range_end}/{file_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(content_length),
                },
            )

        def _generate_full():
            with open(file_path, "rb") as f:
                while chunk := f.read(CHUNK_SIZE):
                    yield chunk

        return StreamingResponse(
            _generate_full(),
            media_type=mime,
            headers={
                "Accept-Ranges": "bytes",
                "Content-Length": str(file_size),
            },
        )
