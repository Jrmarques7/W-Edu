from sqlalchemy.orm import Session, selectinload

from app.models.forum import ForumPost, ForumThread


class ForumRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_thread(self, thread_id: int) -> ForumThread | None:
        return (
            self.db.query(ForumThread)
            .options(
                selectinload(ForumThread.posts).selectinload(ForumPost.author),
                selectinload(ForumThread.author),
            )
            .filter(ForumThread.id == thread_id)
            .first()
        )

    def list_threads_by_course(self, course_id: int) -> list[ForumThread]:
        return (
            self.db.query(ForumThread)
            .options(
                selectinload(ForumThread.posts).selectinload(ForumPost.author),
                selectinload(ForumThread.author),
            )
            .filter(ForumThread.course_id == course_id)
            .order_by(ForumThread.updated_at.desc(), ForumThread.created_at.desc())
            .all()
        )

    def create_thread(self, thread: ForumThread) -> ForumThread:
        self.db.add(thread)
        self.db.commit()
        self.db.refresh(thread)
        return thread

    def create_post(self, post: ForumPost) -> ForumPost:
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def update_thread(self, thread: ForumThread) -> ForumThread:
        self.db.commit()
        self.db.refresh(thread)
        return thread
