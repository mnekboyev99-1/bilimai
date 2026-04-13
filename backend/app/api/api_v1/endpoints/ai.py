from __future__ import annotations

import json
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.errors import AppError
from app.models.course import Course, CourseModule, Enrollment, Lesson, Progress, ProofSession, TutorMessage
from app.models.user import User
from app.schemas.ai import (
    MriGradeRequest,
    MriGradeResponse,
    MriStartRequest,
    MriStartResponse,
    ShogirdStartRequest,
    ShogirdStartResponse,
    ShogirdTurnRequest,
    ShogirdTurnResponse,
    TutorRequest,
    TutorResponse,
)
from app.services.openai_service import OpenAIService, build_candidate_edges

router = APIRouter()


def _normalize_understanding(value: str, mastery_score: float) -> str:
    if mastery_score >= 80:
        score_based = "tushundi"
    elif mastery_score >= 50:
        score_based = "qisman"
    else:
        score_based = "tushunmadi"

    normalized = (
        (value or "")
        .strip()
        .lower()
        .replace("’", "'")
        .replace("‘", "'")
        .replace("`", "'")
    )
    if normalized in {"tushundi", "qisman", "tushunmadi"}:
        return normalized
    if any(token in normalized for token in ["tushunmadi", "noto'g'ri", "notogri", "xato", "chalkash", "yetarli emas"]):
        return "tushunmadi"
    if any(token in normalized for token in ["qisman", "partial", "to'liq emas", "toliq emas"]):
        return "qisman"
    if any(token in normalized for token in ["tushundi", "aniq", "to'g'ri", "togri", "yetarli", "mustahkam"]):
        return "tushundi"
    return score_based


def _get_student_lesson(db: Session, student: User, lesson_id: int) -> tuple[Lesson, Course, CourseModule]:
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise AppError("Dars topilmadi.", status_code=404)
    enrolled = db.query(Enrollment).filter(Enrollment.course_id == lesson.course_id, Enrollment.user_id == student.id).first()
    if not enrolled:
        raise AppError("Bu dars sizga biriktirilmagan.", status_code=403)
    course = db.get(Course, lesson.course_id)
    module = db.get(CourseModule, lesson.module_id)
    if lesson.status != "ready":
        raise AppError("Bu dars hali tayyor emas.", status_code=400)
    return lesson, course, module


def _upsert_progress(db: Session, student: User, lesson: Lesson, *, status: str, mastery_status: str, mastery_score: float, proof_summary: dict, add_seconds: int = 0):
    progress = db.query(Progress).filter(Progress.user_id == student.id, Progress.lesson_id == lesson.id).first()
    if not progress:
        progress = Progress(
            user_id=student.id,
            course_id=lesson.course_id,
            lesson_id=lesson.id,
            status=status,
            mastery_status=mastery_status,
            mastery_score=mastery_score,
            proof_summary_json=proof_summary,
            time_spent_seconds=add_seconds,
        )
        db.add(progress)
    else:
        progress.status = status
        progress.mastery_status = mastery_status
        progress.mastery_score = mastery_score
        progress.proof_summary_json = proof_summary
        progress.time_spent_seconds = int(progress.time_spent_seconds or 0) + add_seconds
    db.commit()


@router.post("/tutor", response_model=TutorResponse)
def tutor(payload: TutorRequest, db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    lesson, course, module = _get_student_lesson(db, student, payload.lesson_id)
    all_lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == lesson.course_id, Lesson.id != lesson.id, Lesson.status == "ready")
        .all()
    )
    related = [{"lesson_id": row.id, "title": row.title, "snippet": (row.summary or row.intro or "")[:180]} for row in all_lessons[:8]]
    ai = OpenAIService()
    result = ai.tutor_reply(course=course, current_module=module, lesson=lesson, related_lessons=related, question=payload.message)
    row = TutorMessage(
        user_id=student.id,
        course_id=course.id,
        lesson_id=lesson.id,
        question=payload.message,
        answer=result.answer,
        response_mode=result.mode,
        refs_json=result.references,
    )
    db.add(row)
    db.commit()
    return TutorResponse(**result.model_dump())


@router.post("/shogird/start", response_model=ShogirdStartResponse)
def shogird_start(payload: ShogirdStartRequest, db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    lesson, course, module = _get_student_lesson(db, student, payload.lesson_id)
    ai = OpenAIService()
    start = ai.shogird_start(course=course, module=module, lesson=lesson)
    session = ProofSession(
        user_id=student.id,
        course_id=course.id,
        lesson_id=lesson.id,
        mode="shogird",
        status="active",
        transcript_json=[{"role": "assistant", "content": start.ai_message}],
        result_json={"target_concepts": start.target_concepts, "typical_mistakes": start.typical_mistakes},
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return ShogirdStartResponse(session_id=session.id, ai_message=start.ai_message, status="active")


@router.post("/shogird/respond", response_model=ShogirdTurnResponse)
def shogird_respond(payload: ShogirdTurnRequest, db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    session = db.get(ProofSession, payload.session_id)
    if not session or session.user_id != student.id or session.mode != "shogird":
        raise AppError("SHOGIRD sessiyasi topilmadi.", status_code=404)
    lesson, course, module = _get_student_lesson(db, student, session.lesson_id)
    ai = OpenAIService()
    transcript = session.transcript_json or []
    transcript.append({"role": "user", "content": payload.student_message})
    result = ai.shogird_turn(lesson=lesson, transcript=transcript, student_message=payload.student_message)
    understanding = _normalize_understanding(result.understanding, result.mastery_score)
    transcript.append({"role": "assistant", "content": result.ai_message})
    session.transcript_json = transcript
    session.result_json = {
        **(session.result_json or {}),
        "understanding": understanding,
        "mastery_score": result.mastery_score,
        "weak_spots": result.weak_spots,
        "what_to_review": result.what_to_review,
    }
    session.status = "passed" if result.status == "pass" else "active"
    db.commit()

    if result.status == "pass":
        _upsert_progress(
            db,
            student,
            lesson,
            status="completed",
            mastery_status="proven",
            mastery_score=result.mastery_score,
            proof_summary={
                "mode": "shogird",
                "understanding": understanding,
                "weak_spots": result.weak_spots,
                "what_to_review": result.what_to_review,
            },
            add_seconds=300,
        )
    payload = result.model_dump()
    payload["understanding"] = understanding
    return ShogirdTurnResponse(session_id=session.id, **payload)


@router.post("/mri/start", response_model=MriStartResponse)
def mri_start(payload: MriStartRequest, db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    lesson, course, module = _get_student_lesson(db, student, payload.lesson_id)
    ai = OpenAIService()
    graph = ai.generate_concept_graph(lesson=lesson).model_dump()
    lesson.concept_graph_json = graph
    candidate_edges = build_candidate_edges(graph)
    session = ProofSession(
        user_id=student.id,
        course_id=course.id,
        lesson_id=lesson.id,
        mode="mri",
        status="active",
        transcript_json=[],
        result_json={"graph": graph, "candidate_edges": candidate_edges},
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return MriStartResponse(session_id=session.id, nodes=graph["nodes"], candidate_edges=candidate_edges)


@router.post("/mri/grade", response_model=MriGradeResponse)
def mri_grade(payload: MriGradeRequest, db: Session = Depends(get_db), student: User = Depends(require_roles("student"))):
    session = db.get(ProofSession, payload.session_id)
    if not session or session.user_id != student.id or session.mode != "mri":
        raise AppError("Bilim MRI sessiyasi topilmadi.", status_code=404)
    lesson, course, module = _get_student_lesson(db, student, session.lesson_id)
    graph = (session.result_json or {}).get("graph", {})
    candidate_edges = (session.result_json or {}).get("candidate_edges", [])
    correct_ids = {f"{edge['source']}|{edge['target']}|{edge['label']}" for edge in graph.get("edges", [])}
    selected_ids = set(payload.selected_edge_ids)
    wrong_ids = sorted(list(selected_ids - correct_ids))
    missing_ids = sorted(list(correct_ids - selected_ids))
    matched_ids = sorted(list(selected_ids & correct_ids))
    total = max(1, len(correct_ids))
    score = round((len(matched_ids) / total) * 100, 1)
    understanding = "tushundi" if score >= 80 else "qisman" if score >= 50 else "tushunmadi"
    id_to_edge = {item["id"]: item for item in candidate_edges}
    ai = OpenAIService()
    explanation = ai.explain_mri_result(
        lesson=lesson,
        correct_edges=[id_to_edge[i] for i in matched_ids if i in id_to_edge],
        wrong_edges=[id_to_edge[i] for i in wrong_ids if i in id_to_edge],
        missing_edges=[edge for edge in graph.get("edges", []) if f"{edge['source']}|{edge['target']}|{edge['label']}" in missing_ids],
    )
    session.status = "passed" if score >= 80 else "active"
    session.result_json = {
        **(session.result_json or {}),
        "grade": {
            "score": score,
            "understanding": understanding,
            "correct_edge_ids": matched_ids,
            "wrong_edge_ids": wrong_ids,
            "missing_edge_ids": missing_ids,
        },
    }
    db.commit()

    if score >= 80:
        _upsert_progress(
            db,
            student,
            lesson,
            status="completed",
            mastery_status="proven",
            mastery_score=score,
            proof_summary={
                "mode": "mri",
                "understanding": understanding,
                "missing_edge_ids": missing_ids,
                "wrong_edge_ids": wrong_ids,
            },
            add_seconds=240,
        )

    return MriGradeResponse(
        session_id=session.id,
        understanding=understanding,
        mastery_score=score,
        correct_edge_ids=matched_ids,
        missing_edge_ids=missing_ids,
        wrong_edge_ids=wrong_ids,
        explanation=explanation,
    )
