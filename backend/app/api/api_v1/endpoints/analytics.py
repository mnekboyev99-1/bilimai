from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.user import User
from app.schemas.analytics import ParentOverview, StudentAnalyticsItem, StudentFeedback
from app.services.analytics_service import ai_feedback_for_student, parent_overview, teacher_student_rows

router = APIRouter()


@router.get("/teacher/students", response_model=list[StudentAnalyticsItem])
def teacher_students(db: Session = Depends(get_db), teacher: User = Depends(require_roles("teacher"))):
    rows = teacher_student_rows(db, teacher)
    return [StudentAnalyticsItem(**row) for row in rows]


@router.get("/teacher/students/{student_id}/feedback", response_model=StudentFeedback)
def teacher_student_feedback(student_id: int, db: Session = Depends(get_db), teacher: User = Depends(require_roles("teacher"))):
    rows = teacher_student_rows(db, teacher)
    row = next((item for item in rows if item["user_id"] == student_id), None)
    if not row:
        return StudentFeedback(strengths=[], weaknesses=[], recommendations=[])
    feedback = ai_feedback_for_student(student_name=row["full_name"], metrics=row)
    return StudentFeedback(**feedback.model_dump())


@router.get("/parent/overview", response_model=ParentOverview)
def parent_dashboard(db: Session = Depends(get_db), parent: User = Depends(require_roles("parent"))):
    data = parent_overview(db, parent)
    return ParentOverview(**data)


@router.get("/student/me")
def student_overview(db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    from app.models.course import Course, Enrollment, Progress

    enrollments = db.query(Enrollment).filter(Enrollment.user_id == student.id).all()
    payload = []
    for enrollment in enrollments:
        course = db.get(Course, enrollment.course_id)
        lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
        progress_rows = db.query(Progress).filter(Progress.user_id == student.id, Progress.course_id == course.id).all()
        lesson_map = {row.lesson_id: row for row in progress_rows}
        completed = sum(1 for row in progress_rows if row.status == "completed")
        total = len(lesson_ids)
        payload.append({
            "course_id": course.id,
            "title": course.title,
            "progress_percent": int((completed / total) * 100) if total else 0,
            "lessons": [
                {
                    "lesson_id": lesson.id,
                    "status": lesson_map.get(lesson.id).status if lesson.id in lesson_map else "not_started",
                    "mastery_status": lesson_map.get(lesson.id).mastery_status if lesson.id in lesson_map else "not_started",
                    "mastery_score": int(lesson_map.get(lesson.id).mastery_score) if lesson.id in lesson_map else 0,
                }
                for module in course.modules for lesson in module.lessons
            ],
        })
    return payload
