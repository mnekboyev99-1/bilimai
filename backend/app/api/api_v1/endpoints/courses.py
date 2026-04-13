from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.core.errors import AppError
from app.models.course import Course, Enrollment
from app.models.user import User
from app.schemas.course import CourseCreateResponse, CourseDetail, OutlineUpdateRequest
from app.services.course_service import create_course_from_ai, course_to_schema, generate_course_content, get_course_for_teacher, save_outline_update

router = APIRouter()


@router.get("", response_model=list[CourseDetail])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "teacher":
        courses = db.query(Course).filter(Course.created_by == current_user.id).order_by(Course.created_at.desc()).all()
    elif current_user.role == "student":
        courses = db.query(Course).join(Enrollment, Enrollment.course_id == Course.id).filter(Enrollment.user_id == current_user.id).order_by(Course.created_at.desc()).all()
    elif current_user.role == "parent":
        child_ids = [child.id for child in current_user.children if child.role == "student"]
        courses = db.query(Course).join(Enrollment, Enrollment.course_id == Course.id).filter(Enrollment.user_id.in_(child_ids)).order_by(Course.created_at.desc()).all() if child_ids else []
    else:
        courses = []
    return [course_to_schema(course) for course in courses]


@router.post("/generate-structure", response_model=CourseDetail)
async def generate_structure(
    title: str = Form(""),
    prompt: str = Form(""),
    language: str = Form("uz"),
    level: str = Form("o_rta"),
    target_audience: str = Form(""),
    module_count: int = Form(5),
    lessons_per_module: int = Form(3),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    teacher: User = Depends(require_roles("teacher")),
):
    course = await create_course_from_ai(
        db=db,
        teacher=teacher,
        course_title=title,
        prompt=prompt,
        language=language,
        level=level,
        target_audience=target_audience,
        module_count=module_count,
        lessons_per_module=lessons_per_module,
        files=files,
    )
    return course_to_schema(course)


@router.put("/{course_id}/outline", response_model=CourseDetail)
def update_outline(
    course_id: int,
    payload: OutlineUpdateRequest,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_roles("teacher")),
):
    course = save_outline_update(db, teacher, course_id, payload.model_dump())
    return course_to_schema(course)


@router.post("/{course_id}/generate-content", response_model=CourseDetail)
def generate_content(
    course_id: int,
    db: Session = Depends(get_db),
    teacher: User = Depends(require_roles("teacher")),
):
    course = generate_course_content(db, teacher, course_id)
    return course_to_schema(course)


@router.get("/{course_id}", response_model=CourseDetail)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.get(Course, course_id)
    if not course:
        raise AppError("Kurs topilmadi.", status_code=404)
    if current_user.role == "teacher" and course.created_by != current_user.id:
        raise AppError("Bu kurs sizga tegishli emas.", status_code=403)
    if current_user.role == "student":
        enrolled = db.query(Enrollment).filter(Enrollment.course_id == course.id, Enrollment.user_id == current_user.id).first()
        if not enrolled:
            raise AppError("Bu kurs sizga biriktirilmagan.", status_code=403)
    if current_user.role == "parent":
        child_ids = [child.id for child in current_user.children if child.role == "student"]
        enrolled = db.query(Enrollment).filter(Enrollment.course_id == course.id, Enrollment.user_id.in_(child_ids)).first() if child_ids else None
        if not enrolled:
            raise AppError("Bu kursni ko‘rish uchun ruxsat yo‘q.", status_code=403)
    return course_to_schema(course)
