from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.course import Course, Enrollment, Lesson, Progress, TutorMessage
from app.models.user import User
from app.services.openai_service import OpenAIService


def teacher_student_rows(db: Session, teacher: User):
    courses = db.query(Course).filter(Course.created_by == teacher.id).all()
    rows = []
    for course in courses:
        lesson_ids = [lesson.id for module in course.modules for lesson in module.lessons]
        total_lessons = len(lesson_ids)
        enrolled_students = (
            db.query(User)
            .join(Enrollment, Enrollment.user_id == User.id)
            .filter(Enrollment.course_id == course.id, User.role == "student")
            .all()
        )
        for student in enrolled_students:
            progress_rows = db.query(Progress).filter(Progress.user_id == student.id, Progress.course_id == course.id).all()
            completed = sum(1 for row in progress_rows if row.status == "completed")
            avg_mastery = int(sum(row.mastery_score for row in progress_rows) / len(progress_rows)) if progress_rows else 0
            time_minutes = int(sum(row.time_spent_seconds for row in progress_rows) / 60) if progress_rows else 0
            tutor_questions = db.query(func.count(TutorMessage.id)).filter(TutorMessage.user_id == student.id, TutorMessage.course_id == course.id).scalar() or 0
            rows.append(
                {
                    "user_id": student.id,
                    "full_name": student.full_name,
                    "course_id": course.id,
                    "course_title": course.title,
                    "completed_lessons": completed,
                    "total_lessons": total_lessons,
                    "progress_percent": int((completed / total_lessons) * 100) if total_lessons else 0,
                    "mastery_score": avg_mastery,
                    "tutor_questions": int(tutor_questions),
                    "time_minutes": time_minutes,
                }
            )
    return rows


def ai_feedback_for_student(*, student_name: str, metrics: dict):
    return OpenAIService().analytics_feedback(student_name=student_name, metrics=metrics)


def parent_overview(db: Session, parent: User):
    children = db.query(User).filter(User.parent_id == parent.id, User.role == "student").all()
    if not children:
        return {"child_name": "", "course_count": 0, "average_progress_percent": 0, "average_mastery_score": 0, "recommendations": [], "courses": []}
    child = children[0]
    course_map = defaultdict(list)
    progress_rows = db.query(Progress).filter(Progress.user_id == child.id).all()
    for row in progress_rows:
        course_map[row.course_id].append(row)
    courses = db.query(Course).join(Enrollment, Enrollment.course_id == Course.id).filter(Enrollment.user_id == child.id).all()
    items = []
    progress_values = []
    mastery_values = []
    for course in courses:
        lessons = [lesson.id for module in course.modules for lesson in module.lessons]
        total_lessons = len(lessons)
        progress = course_map.get(course.id, [])
        completed = sum(1 for p in progress if p.status == "completed")
        mastery = int(sum(p.mastery_score for p in progress) / len(progress)) if progress else 0
        progress_percent = int((completed / total_lessons) * 100) if total_lessons else 0
        progress_values.append(progress_percent)
        mastery_values.append(mastery)
        items.append({
            "user_id": child.id,
            "full_name": child.full_name,
            "course_id": course.id,
            "course_title": course.title,
            "completed_lessons": completed,
            "total_lessons": total_lessons,
            "progress_percent": progress_percent,
            "mastery_score": mastery,
            "tutor_questions": 0,
            "time_minutes": int(sum(p.time_spent_seconds for p in progress) / 60) if progress else 0,
        })
    recommendations = [
        "Farzandingiz darsdan keyin SHOGIRD AI orqali mavzuni tushuntirib ko‘rsin.",
        "Bilim MRI bilan tushunchalar orasidagi bog‘lanishni mustahkamlash foydali.",
        "Tushunmagan bo‘limlarda tutor bilan qisqa savol-javob qilish tavsiya etiladi.",
    ]
    return {
        "child_name": child.full_name,
        "course_count": len(courses),
        "average_progress_percent": int(sum(progress_values) / len(progress_values)) if progress_values else 0,
        "average_mastery_score": int(sum(mastery_values) / len(mastery_values)) if mastery_values else 0,
        "recommendations": recommendations,
        "courses": items,
    }
