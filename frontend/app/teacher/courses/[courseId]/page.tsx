"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { CourseStructureEditor } from "@/features/teacher/CourseStructureEditor";
import { apiGet, apiPost, apiPut, ApiError } from "@/services/api";
import { CourseDetail } from "@/types";

export default function TeacherCourseDetailPage() {
  const { session, loading } = useSessionGuard("teacher");
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCourse() {
    try {
      const data = await apiGet<CourseDetail>(`/courses/${courseId}`);
      setCourse(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kurs yuklanmadi.");
    }
  }

  useEffect(() => {
    if (!session) return;
    loadCourse();
  }, [session, courseId]);

  async function saveOutline(outline: any) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        course_title: outline.course_title || course?.title,
        language: outline.language || course?.language || "uz",
        target_audience: outline.target_audience || course?.target_audience || "",
        level: outline.level || course?.level || "o_rta",
        course_goal: outline.course_goal || "",
        source_priority_explanation: outline.source_priority_explanation || "",
        prompt_conflict_warning: outline.prompt_conflict_warning || "",
        teacher_note: outline.teacher_note || "",
        extracted_topics: outline.extracted_topics || [],
        modules: (outline.modules || []).map((module: any) => ({
          title: module.title,
          summary: module.summary || "",
          learning_outcomes: module.learning_outcomes || module.outcomes || [],
          lessons: (module.lessons || []).map((lesson: any) => ({
            title: lesson.title,
            goal: lesson.goal || "",
            estimated_minutes: Number(lesson.estimated_minutes || 20),
            format_hint: lesson.format_hint || "qadam-baqadam"
          }))
        }))
      };
      const updated = await apiPut<CourseDetail>(`/courses/${courseId}/outline`, payload);
      setCourse(updated);
      setNotice("Struktura saqlandi.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Saqlash amalga oshmadi.");
    } finally {
      setBusy(false);
    }
  }

  async function generateContent() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await apiPost<CourseDetail>(`/courses/${courseId}/generate-content`, {});
      setCourse(updated);
      setNotice("Kontent muvaffaqiyatli yaratildi.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kontent yaratilmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session || !course) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title={course.title} subtitle={`Holat: ${course.status}`}>
      {error ? <div className="notice error">{error}</div> : null}
      {notice ? <div className="notice success">{notice}</div> : null}

      <div className="grid-2">
        <div className="surface">
          <h3 style={{ marginTop: 0 }}>Kurs xulosasi</h3>
          <p className="muted">{course.source_summary || "Manba xulosasi hali shakllanmagan."}</p>
          <div className="btn-row">
            <div className="badge">{course.language}</div>
            <div className="badge">{course.level}</div>
            <div className="badge">{course.modules.length} modul</div>
          </div>
        </div>
        <div className="surface">
          <h3 style={{ marginTop: 0 }}>Kontent holati</h3>
          <p className="muted">
            Avval strukturani tekshiring. So‘ng real AI yordamida barcha darslar uchun to‘liq kontent yarating.
          </p>
          <button className="btn primary" onClick={generateContent} disabled={busy}>
            {busy ? "Kontent yaratilmoqda..." : "Kontent yaratish"}
          </button>
        </div>
      </div>

      <div style={{ height: 20 }} />
      <CourseStructureEditor
        initialOutline={course.outline || {
          course_title: course.title,
          language: course.language,
          level: course.level,
          target_audience: course.target_audience,
          modules: course.modules.map((module) => ({
            title: module.title,
            summary: module.summary,
            learning_outcomes: module.outcomes,
            lessons: module.lessons
          }))
        }}
        onSave={saveOutline}
        onGenerateContent={generateContent}
        busy={busy}
      />

      <div style={{ height: 20 }} />
      <div className="surface">
        <h2 style={{ marginTop: 0 }}>Mavjud modullar</h2>
        <div className="lesson-list">
          {course.modules.map((module) => (
            <div className="lesson-item" key={module.id}>
              <div>
                <strong>{module.position}. {module.title}</strong>
                <div className="muted">{module.summary}</div>
              </div>
              <div className="muted">{module.lessons.length} dars</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
