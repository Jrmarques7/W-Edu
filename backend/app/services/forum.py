from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enrollment import Enrollment
from app.models.forum import ForumPost, ForumThread
from app.models.student import Student, UserRole
from app.repositories.course import CourseRepository
from app.repositories.enrollment import EnrollmentRepository
from app.repositories.forum import ForumRepository
from app.schemas.forum import ForumPostCreate, ForumPostOut, ForumThreadCreate, ForumThreadOut


class ForumService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ForumRepository(db)
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)

    def list_threads(self, course_id: int, current: Student) -> list[ForumThreadOut]:
        self._get_course_or_404(course_id)
        self._ensure_course_access(course_id, current)
        return [self._thread_out(thread, include_posts=False) for thread in self.repo.list_threads_by_course(course_id)]

    def create_thread(self, course_id: int, author: Student, data: ForumThreadCreate) -> ForumThreadOut:
        self._get_course_or_404(course_id)
        self._ensure_course_access(course_id, author)
        thread = self.repo.create_thread(
            ForumThread(course_id=course_id, author_id=author.id, title=data.title, body=data.body)
        )
        thread.author = author
        thread.posts = []
        return self._thread_out(thread)

    def get_thread(self, thread_id: int, current: Student) -> ForumThreadOut:
        thread = self._get_thread_or_404(thread_id)
        self._ensure_course_access(thread.course_id, current)
        return self._thread_out(thread)

    def create_post(self, thread_id: int, author: Student, data: ForumPostCreate) -> ForumThreadOut:
        thread = self._get_thread_or_404(thread_id)
        self._ensure_course_access(thread.course_id, author)
        self.repo.create_post(ForumPost(thread_id=thread.id, author_id=author.id, body=data.body))
        thread = self._get_thread_or_404(thread_id)
        thread.updated_at = datetime.now(timezone.utc)
        self.repo.update_thread(thread)
        return self._thread_out(thread)

    def _get_course_or_404(self, course_id: int):
        course = self.course_repo.get_by_id(course_id)
        if not course:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curso não encontrado")
        return course

    def _ensure_course_access(self, course_id: int, current: Student) -> None:
        if current.role in {UserRole.admin, UserRole.coordinator, UserRole.instructor}:
            return
        if self.enrollment_repo.get_by_student_and_course(current.id, course_id):
            return
        if current.role == UserRole.company_manager and current.organization_id:
            has_org_student = (
                self.db.query(Student.id)
                .join(Enrollment, Enrollment.student_id == Student.id)
                .filter(Student.organization_id == current.organization_id)
                .filter(Enrollment.course_id == course_id)
                .first()
            )
            if has_org_student:
                return
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso ao fórum restrito ao curso")

    def _get_thread_or_404(self, thread_id: int) -> ForumThread:
        thread = self.repo.get_thread(thread_id)
        if not thread:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tópico não encontrado")
        return thread

    def _thread_out(self, thread: ForumThread, include_posts: bool = True) -> ForumThreadOut:
        posts = thread.posts if include_posts else []
        return ForumThreadOut(
            id=thread.id,
            course_id=thread.course_id,
            author_id=thread.author_id,
            author_name=thread.author.name if thread.author else f"Usuário #{thread.author_id}",
            title=thread.title,
            body=thread.body,
            replies_count=len(thread.posts or []),
            created_at=thread.created_at,
            updated_at=thread.updated_at,
            posts=[self._post_out(post) for post in posts],
        )

    def _post_out(self, post: ForumPost) -> ForumPostOut:
        return ForumPostOut(
            id=post.id,
            thread_id=post.thread_id,
            author_id=post.author_id,
            author_name=post.author.name if post.author else f"Usuário #{post.author_id}",
            body=post.body,
            created_at=post.created_at,
            updated_at=post.updated_at,
        )
