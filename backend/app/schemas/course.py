from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LessonOutlineInput(BaseModel):
    title: str
    goal: str
    estimated_minutes: int = 20
    format_hint: str = "qadam-baqadam"


class ModuleOutlineInput(BaseModel):
    title: str
    summary: str = ""
    learning_outcomes: list[str] = Field(default_factory=list)
    lessons: list[LessonOutlineInput] = Field(default_factory=list)


class OutlineUpdateRequest(BaseModel):
    course_title: str
    language: Literal["uz", "ru", "en"] = "uz"
    target_audience: str = ""
    level: str = "o_rta"
    course_goal: str = ""
    source_priority_explanation: str = ""
    prompt_conflict_warning: str = ""
    teacher_note: str = ""
    extracted_topics: list[str] = Field(default_factory=list)
    modules: list[ModuleOutlineInput] = Field(default_factory=list)


class CourseCreateResponse(BaseModel):
    id: int
    title: str
    status: str
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LessonSummary(BaseModel):
    id: int
    position: int
    title: str
    goal: str
    estimated_minutes: int
    status: str
    format_hint: str
    intro: str = ""
    summary: str = ""

    model_config = {"from_attributes": True}


class ModuleSummary(BaseModel):
    id: int
    position: int
    title: str
    summary: str
    outcomes: list[str] = Field(default_factory=list)
    lessons: list[LessonSummary] = Field(default_factory=list)


class CourseDetail(BaseModel):
    id: int
    title: str
    language: str
    level: str
    target_audience: str
    prompt: str
    status: str
    source_summary: str
    created_at: datetime
    updated_at: datetime
    modules: list[ModuleSummary] = Field(default_factory=list)
    outline: dict | None = None

    model_config = {"from_attributes": True}


class LessonDetail(BaseModel):
    id: int
    course_id: int
    module_id: int
    position: int
    title: str
    goal: str
    estimated_minutes: int
    format_hint: str
    status: str
    intro: str
    theory_sections: list[dict] = Field(default_factory=list)
    examples: list[dict] = Field(default_factory=list)
    practical_application: str
    summary: str
    visual_blocks: list[dict] = Field(default_factory=list)
    mini_practice: dict = Field(default_factory=dict)
    source_refs: list[str] = Field(default_factory=list)
    concept_graph: dict | None = None
