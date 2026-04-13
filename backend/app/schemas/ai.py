from typing import Literal

from pydantic import BaseModel, Field


class TutorRequest(BaseModel):
    lesson_id: int
    message: str


class TutorResponse(BaseModel):
    mode: Literal["redirect", "explain"]
    answer: str
    target_lesson_id: int | None = None
    references: list[str] = Field(default_factory=list)


class ShogirdStartRequest(BaseModel):
    lesson_id: int


class ShogirdStartResponse(BaseModel):
    session_id: int
    ai_message: str
    status: Literal["active"]
    persona_name: str = "SHOGIRD AI"


class ShogirdTurnRequest(BaseModel):
    session_id: int
    student_message: str


class ShogirdTurnResponse(BaseModel):
    session_id: int
    status: Literal["continue", "pass", "fail"]
    ai_message: str
    understanding: Literal["tushundi", "qisman", "tushunmadi"]
    mastery_score: float
    weak_spots: list[str] = Field(default_factory=list)
    what_to_review: list[str] = Field(default_factory=list)


class MriStartRequest(BaseModel):
    lesson_id: int


class EdgeCandidate(BaseModel):
    id: str
    source: str
    target: str
    label: str


class MriStartResponse(BaseModel):
    session_id: int
    nodes: list[str]
    candidate_edges: list[EdgeCandidate]


class MriGradeRequest(BaseModel):
    session_id: int
    selected_edge_ids: list[str] = Field(default_factory=list)


class MriGradeResponse(BaseModel):
    session_id: int
    understanding: Literal["tushundi", "qisman", "tushunmadi"]
    mastery_score: float
    correct_edge_ids: list[str] = Field(default_factory=list)
    missing_edge_ids: list[str] = Field(default_factory=list)
    wrong_edge_ids: list[str] = Field(default_factory=list)
    explanation: str
