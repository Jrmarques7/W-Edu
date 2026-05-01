from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.progress import Progress, ProgressStatus
from app.repositories.lesson import LessonRepository
from app.repositories.progress import ProgressRepository
from app.schemas.progress import CourseProgressOut
from app.services.certificate import CertificateService


class ProgressService:
    def __init__(self, db: Session):
        self.repo = ProgressRepository(db)
        self.lesson_repo = LessonRepository(db)
        self.certificate_service = CertificateService(db)

    def mark(self, student_id: int, lesson_id: int, status: ProgressStatus) -> Progress:
        progress = self.repo.upsert(student_id, lesson_id, status)
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if lesson:
            self.certificate_service.auto_issue(lesson.course_id, student_id)
        return progress

    def mark_consumed(self, student_id: int, lesson_id: int) -> Progress:
        progress = self.repo.upsert(student_id, lesson_id, ProgressStatus.in_progress)
        if not progress.content_consumed_at:
            progress.content_consumed_at = datetime.now(timezone.utc)
            self.repo.db.commit()
            self.repo.db.refresh(progress)
        lesson = self.lesson_repo.get_by_id(lesson_id)
        if lesson:
            self.certificate_service.auto_issue(lesson.course_id, student_id)
        return progress

    def list_by_student(self, student_id: int) -> list[Progress]:
        return self.repo.list_by_student(student_id)

    def course_summary(self, student_id: int) -> list[CourseProgressOut]:
        enrollments = (
            self.repo.db.query(Enrollment)
            .filter(Enrollment.student_id == student_id)
            .order_by(Enrollment.enrolled_at.desc())
            .all()
        )
        if not enrollments:
            return []

        course_ids = [enrollment.course_id for enrollment in enrollments]
        courses = {
            course.id: course
            for course in self.repo.db.query(Course).filter(Course.id.in_(course_ids)).all()
        }
        lessons = (
            self.repo.db.query(Lesson)
            .filter(Lesson.course_id.in_(course_ids))
            .order_by(Lesson.course_id, Lesson.order)
            .all()
        )
        lessons_by_course: dict[int, list[Lesson]] = {}
        for lesson in lessons:
            lessons_by_course.setdefault(lesson.course_id, []).append(lesson)

        lesson_ids = [lesson.id for lesson in lessons]
        progress_by_lesson = {
            progress.lesson_id: progress
            for progress in self.repo.db.query(Progress)
            .filter(Progress.student_id == student_id, Progress.lesson_id.in_(lesson_ids or [-1]))
            .all()
        }

        summaries: list[CourseProgressOut] = []
        for enrollment in enrollments:
            course = courses.get(enrollment.course_id)
            course_lessons = lessons_by_course.get(enrollment.course_id, [])
            total_lessons = len(course_lessons)
            done_lessons = 0
            in_progress_lessons = 0
            last_activity_at = None

            for lesson in course_lessons:
                progress = progress_by_lesson.get(lesson.id)
                if not progress:
                    continue
                if progress.status == ProgressStatus.done:
                    done_lessons += 1
                elif progress.status == ProgressStatus.in_progress:
                    in_progress_lessons += 1
                if last_activity_at is None or progress.updated_at > last_activity_at:
                    last_activity_at = progress.updated_at

            pending_lessons = max(total_lessons - done_lessons - in_progress_lessons, 0)
            progress_percent = round(done_lessons / total_lessons * 100) if total_lessons else 0
            summaries.append(
                CourseProgressOut(
                    course_id=enrollment.course_id,
                    course_name=course.name if course else f"Curso #{enrollment.course_id}",
                    total_lessons=total_lessons,
                    done_lessons=done_lessons,
                    in_progress_lessons=in_progress_lessons,
                    pending_lessons=pending_lessons,
                    progress_percent=progress_percent,
                    last_activity_at=last_activity_at,
                )
            )
        return summaries
