from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin_or_company_manager, get_current_student
from app.models.student import Student
from app.schemas.analytics import (
    AnalyticsOverviewOut,
    AttendanceReportRowOut,
    ClassAnalyticsOut,
    ClassPerformanceReportRowOut,
    CompletionReportRowOut,
    CourseAnalyticsOut,
    EngagementReportRowOut,
    RoiReportRowOut,
    StudentAnalyticsOut,
)
from app.services.analytics import AnalyticsService

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewOut)
def overview(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).overview(current)


@router.get("/reports/completion", response_model=list[CompletionReportRowOut])
def completion_report(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).completion_report(current)


@router.get("/reports/attendance", response_model=list[AttendanceReportRowOut])
def attendance_report(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).attendance_report(current)


@router.get("/reports/engagement", response_model=list[EngagementReportRowOut])
def engagement_report(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).engagement_report(current)


@router.get("/reports/performance", response_model=list[ClassPerformanceReportRowOut])
def performance_report(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).performance_report(current)


@router.get("/reports/roi", response_model=list[RoiReportRowOut])
def roi_report(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).roi_report(current)


@router.get("/courses", response_model=list[CourseAnalyticsOut])
def list_courses(db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).courses(current)


@router.get("/courses/{course_id}", response_model=CourseAnalyticsOut)
def get_course(course_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).course(course_id, current)


@router.get("/students/me", response_model=StudentAnalyticsOut)
def me(db: Session = Depends(get_db), current: Student = Depends(get_current_student)):
    return AnalyticsService(db).student_me(current)


@router.get("/students/{student_id}", response_model=StudentAnalyticsOut)
def get_student(student_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).student(student_id, current)


@router.get("/classes/{class_id}", response_model=ClassAnalyticsOut)
def get_class(class_id: int, db: Session = Depends(get_db), current: Student = Depends(get_current_admin_or_company_manager)):
    return AnalyticsService(db).class_(class_id, current)
