"use client";

import { useEffect, useState } from "react";

import { CourseCard } from "@/components/CourseCard";
import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { StatCard } from "@/components/StatCard";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, ApiError } from "@/services/api";
import { CourseDetail, StudentCourseProgress } from "@/types";

export default function StudentDashboardPage() {
  const { session, loading } = useSessionGuard("student");
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [progress, setProgress] = useState<StudentCourseProgress[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiGet<CourseDetail[]>("/courses"),
      apiGet<StudentCourseProgress[]>("/analytics/student/me")
    ]).then(([coursesData, progressData]) => {
      setCourses(coursesData);
      setProgress(progressData);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Ma’lumotlar yuklanmadi."));
  }, [session]);

  if (loading || !session) return <main className="page-shell"><LoadingState /></main>;

  const avgProgress = progress.length ? Math.round(progress.reduce((acc, item) => acc + item.progress_percent, 0) / progress.length) : 0;
  const provenLessons = progress.flatMap((item) => item.lessons).filter((lesson) => lesson.mastery_status === "proven").length;

  return (
    <DashboardShell user={session.user} title="Talaba paneli" subtitle="Kurslar, darslar va bilimni isbotlash jarayoni">
      {error ? <div className="notice error">{error}</div> : null}
      <div className="stats-grid">
        <StatCard label="Kurslar" value={courses.length} hint="Sizga biriktirilgan kurslar" />
        <StatCard label="O‘rtacha jarayon" value={`${avgProgress}%`} hint="Barcha kurslar bo‘yicha" />
        <StatCard label="Isbotlangan darslar" value={provenLessons} hint="SHOGIRD AI yoki Bilim MRI orqali" />
      </div>

      <div style={{ height: 20 }} />

      <div className="card-grid">
        {courses.map((course) => {
          const item = progress.find((row) => row.course_id === course.id);
          return (
            <CourseCard
              key={course.id}
              title={course.title}
              subtitle={`${course.modules.length} modul · ${course.target_audience}`}
              href={`/student/courses/${course.id}`}
              progress={item?.progress_percent || 0}
              status="Faol kurs"
            />
          );
        })}
      </div>
    </DashboardShell>
  );
}
