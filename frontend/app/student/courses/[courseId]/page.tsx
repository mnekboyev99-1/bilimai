"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, ApiError } from "@/services/api";
import { CourseDetail, StudentCourseProgress } from "@/types";

export default function StudentCoursePage() {
  const { session, loading } = useSessionGuard("student");
  const params = useParams<{ courseId: string }>();
  const courseId = Number(params.courseId);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progressData, setProgressData] = useState<StudentCourseProgress | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiGet<CourseDetail>(`/courses/${courseId}`),
      apiGet<StudentCourseProgress[]>("/analytics/student/me")
    ]).then(([courseResp, progressResp]) => {
      setCourse(courseResp);
      setProgressData(progressResp.find((item) => item.course_id === courseId) || null);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Kurs yuklanmadi."));
  }, [session, courseId]);

  const lessonProgress = useMemo(() => {
    return new Map((progressData?.lessons || []).map((item) => [item.lesson_id, item]));
  }, [progressData]);

  if (loading || !session || !course) return <main className="page-shell"><LoadingState /></main>;

  let unlocked = true;

  return (
    <DashboardShell user={session.user} title={course.title} subtitle="Modullar bo‘yicha ketma-ket o‘rganish">
      {error ? <div className="notice error">{error}</div> : null}
      <div className="surface">
        <h2 style={{ marginTop: 0 }}>Kurs tuzilmasi</h2>
        <div className="progress-bar" style={{ marginBottom: 16 }}>
          <div className="progress-inner" style={{ width: `${progressData?.progress_percent || 0}%` }} />
        </div>
        <div className="muted" style={{ marginBottom: 18 }}>Jarayon: {progressData?.progress_percent || 0}%</div>

        {course.modules.map((module) => (
          <div key={module.id} className="surface soft" style={{ marginBottom: 14 }}>
            <h3 style={{ marginTop: 0 }}>{module.position}. {module.title}</h3>
            <p className="muted">{module.summary}</p>
            <div className="lesson-list">
              {module.lessons.map((lesson) => {
                const lessonState = lessonProgress.get(lesson.id);
                const proven = lessonState?.mastery_status === "proven";
                const isUnlocked = unlocked;
                if (!proven) unlocked = false;
                return (
                  <div className={`lesson-item ${isUnlocked ? "" : "locked"}`} key={lesson.id}>
                    <div>
                      <strong>{lesson.position}. {lesson.title}</strong>
                      <div className="muted">{lesson.goal}</div>
                    </div>
                    <div className="btn-row">
                      {proven ? <span className="badge">Isbotlangan</span> : null}
                      {isUnlocked ? (
                        <Link className="btn primary" href={`/student/lessons/${lesson.id}`}>Darsni ochish</Link>
                      ) : (
                        <button className="btn" disabled>Avval oldingi dars</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
