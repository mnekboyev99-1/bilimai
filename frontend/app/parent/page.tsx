"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { StatCard } from "@/components/StatCard";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, ApiError } from "@/services/api";

type ParentOverview = {
  child_name: string;
  course_count: number;
  average_progress_percent: number;
  average_mastery_score: number;
  recommendations: string[];
  courses: {
    course_id: number;
    course_title: string;
    completed_lessons: number;
    total_lessons: number;
    progress_percent: number;
    mastery_score: number;
    time_minutes: number;
  }[];
};

export default function ParentPage() {
  const { session, loading } = useSessionGuard("parent");
  const [overview, setOverview] = useState<ParentOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    apiGet<ParentOverview>("/analytics/parent/overview")
      .then(setOverview)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Ma’lumotlar yuklanmadi."));
  }, [session]);

  if (loading || !session || !overview) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title="Ota-ona paneli" subtitle="Farzandingizning haqiqiy o‘quv progressi">
      {error ? <div className="notice error">{error}</div> : null}

      <div className="stats-grid">
        <StatCard label="Farzand" value={overview.child_name || "Biriktirilmagan"} />
        <StatCard label="Kurslar" value={overview.course_count} />
        <StatCard label="O‘rtacha progress" value={`${overview.average_progress_percent}%`} />
        <StatCard label="O‘rtacha o‘zlashtirish" value={overview.average_mastery_score} />
      </div>

      <div style={{ height: 20 }} />

      <div className="grid-2">
        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Kurslar bo‘yicha holat</h2>
          <div className="lesson-list">
            {overview.courses.map((course) => (
              <div className="lesson-item" key={course.course_id}>
                <div>
                  <strong>{course.course_title}</strong>
                  <div className="muted">{course.completed_lessons}/{course.total_lessons} dars yakunlangan</div>
                </div>
                <div className="muted">Jarayon: {course.progress_percent}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface">
          <h2 style={{ marginTop: 0 }}>AI tavsiyalari</h2>
          <ul>
            {overview.recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}
