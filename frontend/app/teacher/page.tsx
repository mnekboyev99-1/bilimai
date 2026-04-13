"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseCard } from "@/components/CourseCard";
import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { StatCard } from "@/components/StatCard";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, ApiError } from "@/services/api";
import { CourseDetail, TeacherAnalyticsRow } from "@/types";

type Feedback = {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

export default function TeacherDashboardPage() {
  const { session, loading } = useSessionGuard("teacher");
  const [courses, setCourses] = useState<CourseDetail[]>([]);
  const [rows, setRows] = useState<TeacherAnalyticsRow[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiGet<CourseDetail[]>("/courses"),
      apiGet<TeacherAnalyticsRow[]>("/analytics/teacher/students")
    ]).then(([courseData, rowData]) => {
      setCourses(courseData);
      setRows(rowData);
      if (rowData[0]) {
        setSelectedStudentId(rowData[0].user_id);
      }
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Ma’lumotlar yuklanmadi."));
  }, [session]);

  useEffect(() => {
    if (!selectedStudentId) return;
    setFeedbackBusy(true);
    apiGet<Feedback>(`/analytics/teacher/students/${selectedStudentId}/feedback`)
      .then(setFeedback)
      .catch((err) => setError(err instanceof ApiError ? err.message : "AI xulosa olinmadi."))
      .finally(() => setFeedbackBusy(false));
  }, [selectedStudentId]);

  if (loading || !session) return <main className="page-shell"><LoadingState /></main>;

  const uniqueStudents = new Set(rows.map((r) => r.user_id)).size;
  const averageProgress = rows.length ? Math.round(rows.reduce((acc, row) => acc + row.progress_percent, 0) / rows.length) : 0;
  const averageMastery = rows.length ? Math.round(rows.reduce((acc, row) => acc + row.mastery_score, 0) / rows.length) : 0;
  const selectedRow = rows.find((row) => row.user_id === selectedStudentId) || null;

  return (
    <DashboardShell user={session.user} title="O‘qituvchi boshqaruv paneli" subtitle="Kurslar, tahlil va aralashuv uchun boshqaruv paneli">
      {error ? <div className="notice error">{error}</div> : null}

      <div className="stats-grid">
        <StatCard label="Kurslar" value={courses.length} hint="Yaratilgan kurslar" />
        <StatCard label="Talabalar" value={uniqueStudents} hint="Faol o‘quvchilar" />
        <StatCard label="O‘rtacha progress" value={`${averageProgress}%`} hint="Barcha kurslar bo‘yicha" />
        <StatCard label="O‘rtacha o‘zlashtirish" value={`${averageMastery}`} hint="AI isbotlash natijasi" />
      </div>

      <div style={{ height: 20 }} />

      <div className="btn-row">
        <Link className="btn primary" href="/teacher/courses/new">Yangi kurs yaratish</Link>
      </div>

      <div style={{ height: 20 }} />

      <div className="surface">
        <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ margin: 0 }}>Mening kurslarim</h2>
        </div>
        {courses.length === 0 ? (
          <div className="notice">Hali kurs yo‘q. Yangi kurs yaratishni boshlang.</div>
        ) : (
          <div className="card-grid">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                subtitle={`${course.modules.length} modul · ${course.status}`}
                href={`/teacher/courses/${course.id}`}
                status={course.status}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />

      <div className="grid-2">
        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Talabalar kesimida ko‘rinish</h2>
          {rows.length === 0 ? (
            <div className="notice">Talabalar bo‘yicha tahlil hali shakllanmagan.</div>
          ) : (
            <div className="lesson-list">
              {rows.map((row) => (
                <button
                  key={`${row.user_id}-${row.course_id}`}
                  className="lesson-item"
                  style={{ textAlign: "left", cursor: "pointer" }}
                  onClick={() => setSelectedStudentId(row.user_id)}
                >
                  <div>
                    <strong>{row.full_name}</strong>
                    <div className="muted">{row.course_title}</div>
                  </div>
                  <div className="muted">O‘zlashtirish jarayoni: {row.progress_percent}% · Isbot balli: {row.mastery_score}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="surface">
          <h2 style={{ marginTop: 0 }}>AI xulosa</h2>
          {feedbackBusy ? <LoadingState label="AI xulosa yaratilmoqda..." /> : null}
          {!selectedRow ? <div className="notice">Talabani tanlang.</div> : (
            <>
              <div className="small-card">
                <strong>{selectedRow.full_name}</strong>
                <div className="muted">{selectedRow.course_title}</div>
                <div className="muted">O‘zlashtirish jarayoni: {selectedRow.progress_percent}% · Isbot balli: {selectedRow.mastery_score}</div>
              </div>
              <div style={{ height: 12 }} />
              <div className="small-card">
                <strong>Kuchli tomonlar</strong>
                <ul>{feedback?.strengths?.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div style={{ height: 12 }} />
              <div className="small-card">
                <strong>Zaif tomonlar</strong>
                <ul>{feedback?.weaknesses?.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div style={{ height: 12 }} />
              <div className="small-card">
                <strong>Tavsiyalar</strong>
                <ul>{feedback?.recommendations?.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
