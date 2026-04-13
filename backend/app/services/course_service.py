from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.models.course import Course, CourseModule, Enrollment, Lesson, SourceChunk, SourceDocument
from app.models.user import User
from app.schemas.course import CourseDetail, LessonDetail, ModuleSummary
from app.services.documents import build_source_summary, chunk_text, extract_keywords, parse_upload
from app.services.openai_service import OpenAIService


async def create_course_from_ai(
    *,
    db: Session,
    teacher: User,
    course_title: str,
    prompt: str,
    language: str,
    level: str,
    target_audience: str,
    module_count: int,
    lessons_per_module: int,
    files,
) -> Course:
    documents_payload: list[tuple[str, str, str, dict, list[str]]] = []
    all_chunks: list[str] = []

    for upload in files or []:
        text, meta = await parse_upload(upload)
        if not text.strip():
            continue
        file_chunks = chunk_text(text)
        documents_payload.append((upload.filename or "fayl", (upload.filename or "").split(".")[-1], upload.content_type or "", meta, file_chunks))
        all_chunks.extend(file_chunks)

    summary = build_source_summary(all_chunks, language)
    ai = OpenAIService()
    outline = ai.generate_outline(
        course_title=course_title,
        prompt=prompt,
        language=language,
        level=level,
        target_audience=target_audience,
        module_count=module_count,
        lessons_per_module=lessons_per_module,
        source_chunks=all_chunks,
        source_summary=summary,
    )

    course = Course(
        title=outline.course_title or course_title or "AI kurs",
        language=language,
        level=level,
        target_audience=target_audience,
        prompt=prompt,
        status="outline_generated",
        outline_json=outline.model_dump(),
        source_summary=summary.get("preview", ""),
        created_by=teacher.id,
    )
    db.add(course)
    db.flush()

    chunk_counter = 1
    for filename, extension, content_type, meta, file_chunks in documents_payload:
        doc = SourceDocument(
            course_id=course.id,
            filename=filename,
            extension=extension,
            content_type=content_type,
            text_content="\n\n".join(file_chunks),
            meta_json=meta,
        )
        db.add(doc)
        db.flush()
        for chunk in file_chunks:
            db.add(
                SourceChunk(
                    course_id=course.id,
                    document_id=doc.id,
                    chunk_index=chunk_counter,
                    text=chunk,
                    keywords_json=extract_keywords(chunk, language, top_n=12),
                )
            )
            chunk_counter += 1

    for module_index, module in enumerate(outline.modules, start=1):
        module_row = CourseModule(
            course_id=course.id,
            position=module_index,
            title=module.title,
            summary=module.summary,
            outcomes_json=module.learning_outcomes,
        )
        db.add(module_row)
        db.flush()
        for lesson_index, lesson in enumerate(module.lessons, start=1):
            db.add(
                Lesson(
                    course_id=course.id,
                    module_id=module_row.id,
                    position=lesson_index,
                    title=lesson.title,
                    goal=lesson.goal,
                    estimated_minutes=lesson.estimated_minutes,
                    format_hint=lesson.format_hint,
                    status="outline",
                )
            )

    db.commit()
    db.refresh(course)
    return course


def get_course_for_teacher(db: Session, teacher: User, course_id: int) -> Course:
    course = db.query(Course).filter(Course.id == course_id, Course.created_by == teacher.id).first()
    if not course:
        raise AppError("Kurs topilmadi.", status_code=404)
    return course


def save_outline_update(db: Session, teacher: User, course_id: int, payload: dict) -> Course:
    course = get_course_for_teacher(db, teacher, course_id)
    course.title = payload["course_title"]
    course.language = payload["language"]
    course.level = payload["level"]
    course.target_audience = payload["target_audience"]
    course.outline_json = payload
    db.query(Lesson).filter(Lesson.course_id == course.id).delete()
    db.query(CourseModule).filter(CourseModule.course_id == course.id).delete()
    db.flush()
    for module_index, module in enumerate(payload["modules"], start=1):
        module_row = CourseModule(
            course_id=course.id,
            position=module_index,
            title=module["title"],
            summary=module.get("summary", ""),
            outcomes_json=module.get("learning_outcomes", []),
        )
        db.add(module_row)
        db.flush()
        for lesson_index, lesson in enumerate(module.get("lessons", []), start=1):
            db.add(
                Lesson(
                    course_id=course.id,
                    module_id=module_row.id,
                    position=lesson_index,
                    title=lesson["title"],
                    goal=lesson.get("goal", ""),
                    estimated_minutes=int(lesson.get("estimated_minutes", 20)),
                    format_hint=lesson.get("format_hint", "qadam-baqadam"),
                    status="outline",
                )
            )
    db.commit()
    db.refresh(course)
    return course


def generate_course_content(db: Session, teacher: User, course_id: int) -> Course:
    course = get_course_for_teacher(db, teacher, course_id)
    ai = OpenAIService()
    chunks = db.query(SourceChunk).filter(SourceChunk.course_id == course.id).all()
    chunk_text_lookup = list(chunks)
    for module in course.modules:
        for lesson in module.lessons:
            relevant = chunk_text_lookup[:8]
            payload = ai.generate_lesson_content(course=course, module=module, lesson=lesson, source_refs=relevant)
            lesson.intro = payload.intro
            lesson.theory_sections_json = [item.model_dump() for item in payload.theory_sections]
            lesson.examples_json = [item.model_dump() for item in payload.examples]
            lesson.practical_application = payload.practical_application
            lesson.summary = payload.summary
            lesson.visual_blocks_json = [item.model_dump() for item in payload.visual_blocks]
            lesson.mini_practice_json = payload.mini_practice.model_dump()
            lesson.source_refs_json = payload.source_refs
            lesson.status = "ready"
    course.status = "published"

    student_ids = [user.id for user in db.query(User).filter(User.role == "student").all()]
    for user_id in student_ids:
        exists = db.query(Enrollment).filter(Enrollment.course_id == course.id, Enrollment.user_id == user_id).first()
        if not exists:
            db.add(Enrollment(user_id=user_id, course_id=course.id))
    db.commit()
    db.refresh(course)
    return course


def course_to_schema(course: Course) -> CourseDetail:
    modules = []
    for module in sorted(course.modules, key=lambda x: x.position):
        modules.append(
            ModuleSummary(
                id=module.id,
                position=module.position,
                title=module.title,
                summary=module.summary,
                outcomes=module.outcomes_json or [],
                lessons=[
                    {
                        "id": lesson.id,
                        "position": lesson.position,
                        "title": lesson.title,
                        "goal": lesson.goal,
                        "estimated_minutes": lesson.estimated_minutes,
                        "status": lesson.status,
                        "format_hint": lesson.format_hint,
                        "intro": lesson.intro or "",
                        "summary": lesson.summary or "",
                    }
                    for lesson in sorted(module.lessons, key=lambda x: x.position)
                ],
            )
        )
    return CourseDetail(
        id=course.id,
        title=course.title,
        language=course.language,
        level=course.level,
        target_audience=course.target_audience,
        prompt=course.prompt,
        status=course.status,
        source_summary=course.source_summary,
        created_at=course.created_at,
        updated_at=course.updated_at,
        modules=modules,
        outline=course.outline_json,
    )


def lesson_to_schema(lesson: Lesson) -> LessonDetail:
    return LessonDetail(
        id=lesson.id,
        course_id=lesson.course_id,
        module_id=lesson.module_id,
        position=lesson.position,
        title=lesson.title,
        goal=lesson.goal,
        estimated_minutes=lesson.estimated_minutes,
        format_hint=lesson.format_hint,
        status=lesson.status,
        intro=lesson.intro or "",
        theory_sections=lesson.theory_sections_json or [],
        examples=lesson.examples_json or [],
        practical_application=lesson.practical_application or "",
        summary=lesson.summary or "",
        visual_blocks=lesson.visual_blocks_json or [],
        mini_practice=lesson.mini_practice_json or {},
        source_refs=lesson.source_refs_json or [],
        concept_graph=lesson.concept_graph_json,
    )
