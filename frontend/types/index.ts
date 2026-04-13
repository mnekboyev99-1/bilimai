export type Role = "teacher" | "student" | "parent";

export type SessionUser = {
  id: number;
  full_name: string;
  email: string;
  role: Role;
};

export type SessionData = {
  token: string;
  user: SessionUser;
};

export type LessonSummary = {
  id: number;
  position: number;
  title: string;
  goal: string;
  estimated_minutes: number;
  status: string;
  format_hint: string;
  intro: string;
  summary: string;
};

export type ModuleSummary = {
  id: number;
  position: number;
  title: string;
  summary: string;
  outcomes: string[];
  lessons: LessonSummary[];
};

export type CourseDetail = {
  id: number;
  title: string;
  language: string;
  level: string;
  target_audience: string;
  prompt: string;
  status: string;
  source_summary: string;
  created_at: string;
  updated_at: string;
  modules: ModuleSummary[];
  outline: any;
};

export type LessonDetail = {
  id: number;
  course_id: number;
  module_id: number;
  position: number;
  title: string;
  goal: string;
  estimated_minutes: number;
  format_hint: string;
  status: string;
  intro: string;
  theory_sections: { heading: string; body: string; bullets: string[] }[];
  examples: { title: string; explanation: string; steps: string[] }[];
  practical_application: string;
  summary: string;
  visual_blocks: { kind: string; title: string; content: string }[];
  mini_practice: { task?: string; expected_points?: string[] };
  source_refs: string[];
  concept_graph?: any;
};

export type TeacherAnalyticsRow = {
  user_id: number;
  full_name: string;
  course_id: number;
  course_title: string;
  completed_lessons: number;
  total_lessons: number;
  progress_percent: number;
  mastery_score: number;
  tutor_questions: number;
  time_minutes: number;
};

export type StudentCourseProgress = {
  course_id: number;
  title: string;
  progress_percent: number;
  lessons: { lesson_id: number; status: string; mastery_status: string; mastery_score: number }[];
};
