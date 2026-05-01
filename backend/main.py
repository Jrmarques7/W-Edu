from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, students, courses, lessons, enrollments, progress, sessions, webhooks, admin, quiz, learning_paths, schedule, certificates, notifications, finance, documents, analytics, forum, chat

app = FastAPI(title="W-Edu API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(courses.router, prefix="/courses", tags=["courses"])
app.include_router(lessons.router, prefix="/lessons", tags=["lessons"])
app.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(quiz.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(learning_paths.router, prefix="/learning-paths", tags=["learning-paths"])
app.include_router(schedule.router, prefix="/schedule", tags=["schedule"])
app.include_router(certificates.router, prefix="/certificates", tags=["certificates"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(finance.router, prefix="/finance", tags=["finance"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(forum.router, prefix="/forum", tags=["forum"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "w-edu"}
