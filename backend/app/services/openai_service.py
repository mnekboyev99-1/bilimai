from __future__ import annotations

import itertools
import json
import random
from typing import Any

from openai import OpenAI
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.models.course import Course, CourseModule, Lesson, ProofSession, SourceChunk

settings = get_settings()


class OutlineLesson(BaseModel):
    title: str
    goal: str
    estimated_minutes: int = 20
    format_hint: str = "qadam-baqadam"


class OutlineModule(BaseModel):
    title: str
    summary: str
    learning_outcomes: list[str] = Field(default_factory=list)
    lessons: list[OutlineLesson] = Field(default_factory=list)


class OutlineResponse(BaseModel):
    course_title: str
    language: str
    target_audience: str
    level: str
    course_goal: str
    source_priority_explanation: str
    prompt_conflict_warning: str
    teacher_note: str
    extracted_topics: list[str] = Field(default_factory=list)
    modules: list[OutlineModule] = Field(default_factory=list)


class TheorySection(BaseModel):
    heading: str
    body: str
    bullets: list[str] = Field(default_factory=list)


class ExampleItem(BaseModel):
    title: str
    explanation: str
    steps: list[str] = Field(default_factory=list)


class VisualBlock(BaseModel):
    kind: str
    title: str
    content: str


class MiniPractice(BaseModel):
    task: str
    expected_points: list[str] = Field(default_factory=list)


class LessonContentResponse(BaseModel):
    intro: str
    theory_sections: list[TheorySection] = Field(default_factory=list)
    examples: list[ExampleItem] = Field(default_factory=list)
    practical_application: str
    summary: str
    visual_blocks: list[VisualBlock] = Field(default_factory=list)
    mini_practice: MiniPractice
    source_refs: list[str] = Field(default_factory=list)


class TutorResponseModel(BaseModel):
    mode: str
    answer: str
    target_lesson_id: int | None = None
    references: list[str] = Field(default_factory=list)


class ShogirdStartModel(BaseModel):
    ai_message: str
    target_concepts: list[str] = Field(default_factory=list)
    typical_mistakes: list[str] = Field(default_factory=list)


class ShogirdTurnModel(BaseModel):
    status: str
    ai_message: str
    understanding: str
    mastery_score: float
    weak_spots: list[str] = Field(default_factory=list)
    what_to_review: list[str] = Field(default_factory=list)


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str


class MriGraphModel(BaseModel):
    nodes: list[str] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class FeedbackModel(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class OpenAIService:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise AppError("OPENAI_API_KEY topilmadi. Backend .env faylini to‘ldiring.", status_code=500)
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    def _schema_response(self, name: str, schema_model: type[BaseModel], messages: list[dict[str, Any]]) -> BaseModel:
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": name,
                    "strict": True,
                    "schema": schema_model.model_json_schema(),
                },
            },
            temperature=0.2,
        )
        content = completion.choices[0].message.content or "{}"
        return schema_model.model_validate_json(content)

    def generate_outline(
        self,
        *,
        course_title: str,
        prompt: str,
        language: str,
        level: str,
        target_audience: str,
        module_count: int,
        lessons_per_module: int,
        source_chunks: list[str],
        source_summary: dict[str, Any],
    ) -> OutlineResponse:
        if not source_chunks and not prompt.strip():
            raise AppError("Kurs yaratish uchun fayl yoki prompt kerak.")
        source_context = "\n\n".join(source_chunks[:10])
        system = (
            "Siz ta'lim metodisti va kurs arxitektorisiz. "
            "Kursni faqat berilgan manba matni va prompt asosida yarating. "
            "Agar fayl berilgan bo‘lsa, manba ustuvor. Javob faqat tanlangan tilda bo‘lsin."
        )
        user = f"""
Til: {language}
Daraja: {level}
Maqsadli auditoriya: {target_audience}
Kurs nomi: {course_title or "AI aniqlaydi"}
Modullar soni: {module_count}
Har moduldagi darslar soni: {lessons_per_module}
Foydalanuvchi prompti: {prompt or "yo‘q"}
Manba kalit mavzulari: {", ".join(source_summary.get("keywords", [])[:15])}
Manba qisqacha ko‘rinishi:
{source_summary.get("preview", "")}

Asosiy manba matni:
{source_context}
"""
        return self._schema_response(
            "course_outline",
            OutlineResponse,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def generate_lesson_content(
        self,
        *,
        course: Course,
        module: CourseModule,
        lesson: Lesson,
        source_refs: list[SourceChunk],
    ) -> LessonContentResponse:
        refs_text = "\n\n".join(f"[{c.id}] {c.text}" for c in source_refs[:8])
        system = (
            "Siz online kurslar uchun professional dars yaratuvchi AI-assistentsiz. "
            "Javob to‘liq o‘zbek tilida bo‘lsin. Darslar chuqur, amaliy va o‘qitishga yaroqli bo‘lsin."
        )
        user = f"""
Kurs: {course.title}
Modul: {module.title}
Dars: {lesson.title}
Dars maqsadi: {lesson.goal}
Uslub: {lesson.format_hint}
Talaba darajasi: {course.level}
Auditoriya: {course.target_audience}

Talablar:
- kirish
- 3 ta chuqur nazariya bo‘limi
- kamida 1 ta misol
- amaliy qo‘llash
- xulosa
- foydali bo‘lsa vizual bloklar
- mini-practice
- source_refs sifatida faqat berilgan [id] larni ishlating

Manba parchalari:
{refs_text}
"""
        return self._schema_response(
            "lesson_content",
            LessonContentResponse,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def tutor_reply(
        self,
        *,
        lesson: Lesson,
        current_module: CourseModule,
        course: Course,
        related_lessons: list[dict[str, Any]],
        question: str,
    ) -> TutorResponseModel:
        system = (
            "Siz o‘quv murabbiysiz. Tayyor javob beruvchi bot emassiz. "
            "Agar savol kursning boshqa darsida yoritilgan bo‘lsa, redirect qaytaring. "
            "Agar yangi, ammo shu mavzu doirasida bo‘lsa, qisqa tushuntirish bering."
        )
        user = f"""
Kurs: {course.title}
Joriy modul: {current_module.title}
Joriy dars: {lesson.title}
Joriy dars maqsadi: {lesson.goal}
Joriy dars kirishi: {lesson.intro}
Nazariya: {json.dumps(lesson.theory_sections_json or [], ensure_ascii=False)}
Boshqa darslar: {json.dumps(related_lessons, ensure_ascii=False)}

Talaba savoli:
{question}

Javob formatidagi mode faqat redirect yoki explain bo‘lsin.
"""
        return self._schema_response(
            "tutor_response",
            TutorResponseModel,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def shogird_start(self, *, course: Course, module: CourseModule, lesson: Lesson) -> ShogirdStartModel:
        system = (
            "Siz SHOGIRD AI uchun AI-o‘quvchisiz. Siz biroz chalkashasiz, tipik xatolar qilasiz va talabadan mavzuni tushuntirishni so‘raysiz. "
            "Hech qachon to‘g‘ri javobni o‘zingiz aytmang."
        )
        user = f"""
Kurs: {course.title}
Modul: {module.title}
Dars: {lesson.title}
Dars maqsadi: {lesson.goal}
Kirish: {lesson.intro}
Nazariya: {json.dumps(lesson.theory_sections_json or [], ensure_ascii=False)}
Misollar: {json.dumps(lesson.examples_json or [], ensure_ascii=False)}

Talaba darsni tugatdi. Endi unga 1 ta tipik noto‘g‘ri tushuncha bilan murojaat qiling va tushuntirishni so‘rang.
"""
        return self._schema_response(
            "shogird_start",
            ShogirdStartModel,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def shogird_turn(
        self,
        *,
        lesson: Lesson,
        transcript: list[dict[str, str]],
        student_message: str,
    ) -> ShogirdTurnModel:
        system = (
            "Siz SHOGIRD AI'siz. Talabaning tushuntirishini sinovdan o‘tkazasiz. "
            "Juda yuzaki javoblarga ishonmang. To‘g‘ri javobni oshkor qilmang. "
            "Agar tushuntirish yetarli bo‘lsa, status=pass. Aks holda status=continue yoki fail."
        )
        user = f"""
Dars: {lesson.title}
Dars maqsadi: {lesson.goal}
Nazariya: {json.dumps(lesson.theory_sections_json or [], ensure_ascii=False)}
Oldingi transcript: {json.dumps(transcript, ensure_ascii=False)}
Talabaning yangi javobi: {student_message}
"""
        return self._schema_response(
            "shogird_turn",
            ShogirdTurnModel,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def generate_concept_graph(self, *, lesson: Lesson) -> MriGraphModel:
        system = (
            "Siz Bilim MRI uchun concept graph yaratuvchisiz. "
            "Darsning asosiy tuzilmasini 5-8 tugun va 5-8 bog‘lanish orqali ifodalang. "
            "Faqat o‘zbek tilida yozing."
        )
        user = f"""
Dars: {lesson.title}
Maqsad: {lesson.goal}
Kirish: {lesson.intro}
Nazariya: {json.dumps(lesson.theory_sections_json or [], ensure_ascii=False)}
Misollar: {json.dumps(lesson.examples_json or [], ensure_ascii=False)}
Amaliy qism: {lesson.practical_application}
Xulosa: {lesson.summary}
"""
        return self._schema_response(
            "mri_graph",
            MriGraphModel,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )

    def explain_mri_result(
        self,
        *,
        lesson: Lesson,
        correct_edges: list[dict[str, Any]],
        wrong_edges: list[dict[str, Any]],
        missing_edges: list[dict[str, Any]],
    ) -> str:
        system = "Siz Bilim MRI natijasini tushuntiruvchi AI-murabbiysiz. Javobni sodda o‘zbek tilida yozing."
        user = f"""
Dars: {lesson.title}
To‘g‘ri bog‘lanishlar: {json.dumps(correct_edges, ensure_ascii=False)}
Noto‘g‘ri tanlangan bog‘lanishlar: {json.dumps(wrong_edges, ensure_ascii=False)}
O‘tkazib yuborilgan bog‘lanishlar: {json.dumps(missing_edges, ensure_ascii=False)}

Qisqa feedback yozing: nimani tushungan, nimani qayta ko‘rish kerak, keyingi qadam nima.
"""
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
            temperature=0.2,
        )
        return (completion.choices[0].message.content or "").strip()

    def analytics_feedback(self, *, student_name: str, metrics: dict[str, Any]) -> FeedbackModel:
        system = "Siz teacher va parent dashboard uchun qisqa AI feedback yaratuvchisiz. Javob faqat o‘zbek tilida bo‘lsin."
        user = f"""
Talaba: {student_name}
Ko‘rsatkichlar: {json.dumps(metrics, ensure_ascii=False)}
3 ta kuchli tomon, 3 ta zaif tomon, 3 ta tavsiya yozing.
"""
        return self._schema_response(
            "analytics_feedback",
            FeedbackModel,
            [{"role": "system", "content": system}, {"role": "user", "content": user}],
        )


def build_candidate_edges(graph: dict[str, Any]) -> list[dict[str, str]]:
    nodes = graph.get("nodes", [])
    correct = graph.get("edges", [])
    candidates = []
    seen = set()
    for edge in correct:
        edge_id = f"{edge['source']}|{edge['target']}|{edge['label']}"
        seen.add(edge_id)
        candidates.append({"id": edge_id, **edge})
    rnd = random.Random(len(nodes) + len(correct))
    pool = list(itertools.permutations(nodes, 2))
    rnd.shuffle(pool)
    for source, target in pool:
        if len(candidates) >= max(8, len(correct) * 2):
            break
        label = rnd.choice(["ta’sir qiladi", "bog‘liq", "olib keladi", "qismidir"])
        edge_id = f"{source}|{target}|{label}"
        if edge_id in seen:
            continue
        candidates.append({"id": edge_id, "source": source, "target": target, "label": label})
        seen.add(edge_id)
    rnd.shuffle(candidates)
    return candidates
