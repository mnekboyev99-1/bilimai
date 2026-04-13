from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.errors import AppError
from app.models.course import Course, Enrollment, Lesson
from app.models.user import User
from app.schemas.course import LessonDetail
from app.services.course_service import lesson_to_schema

router = APIRouter()


@router.get("/{lesson_id}", response_model=LessonDetail)
def get_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise AppError("Dars topilmadi.", status_code=404)
    course = db.get(Course, lesson.course_id)
    if current_user.role == "teacher" and course.created_by != current_user.id:
        raise AppError("Bu darsni ko‘rish uchun ruxsat yo‘q.", status_code=403)
    if current_user.role == "student":
        enrolled = db.query(Enrollment).filter(Enrollment.course_id == lesson.course_id, Enrollment.user_id == current_user.id).first()
        if not enrolled:
            raise AppError("Bu dars sizga biriktirilmagan.", status_code=403)
    if current_user.role == "parent":
        child_ids = [child.id for child in current_user.children if child.role == "student"]
        enrolled = db.query(Enrollment).filter(Enrollment.course_id == lesson.course_id, Enrollment.user_id.in_(child_ids)).first() if child_ids else None
        if not enrolled:
            raise AppError("Bu darsni ko‘rish uchun ruxsat yo‘q.", status_code=403)
    return lesson_to_schema(lesson)
