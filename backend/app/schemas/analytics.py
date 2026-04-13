from pydantic import BaseModel, Field


class StudentAnalyticsItem(BaseModel):
    user_id: int
    full_name: str
    course_id: int
    course_title: str
    completed_lessons: int
    total_lessons: int
    progress_percent: int
    mastery_score: int
    tutor_questions: int
    time_minutes: int


class StudentFeedback(BaseModel):
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class ParentOverview(BaseModel):
    child_name: str
    course_count: int
    average_progress_percent: int
    average_mastery_score: int
    recommendations: list[str] = Field(default_factory=list)
    courses: list[StudentAnalyticsItem] = Field(default_factory=list)
