"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, apiPost, ApiError } from "@/services/api";
import { LessonDetail } from "@/types";

type TutorResponse = {
  mode: "redirect" | "explain";
  answer: string;
  target_lesson_id?: number | null;
  references: string[];
};

export default function LessonPage() {
  const { session, loading } = useSessionGuard("student");
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string; references?: string[] }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    apiGet<LessonDetail>(`/lessons/${lessonId}`).then(setLesson).catch((err) => setError(err instanceof ApiError ? err.message : "Dars yuklanmadi."));
  }, [session, lessonId]);

  async function handleTutor(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    const currentQuestion = question;
    setQuestion("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: currentQuestion }]);
    try {
      const response = await apiPost<TutorResponse>("/ai/tutor", { lesson_id: lessonId, message: currentQuestion });
      setMessages((prev) => [...prev, { role: "ai", text: response.answer, references: response.references }]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tutor javobi olinmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session || !lesson) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title={lesson.title} subtitle="Dars mazmuni va bilimni isbotlash">
      {error ? <div className="notice error">{error}</div> : null}

      <div className="grid-2">
        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Dars mazmuni</h2>
          <p>{lesson.intro}</p>
          {lesson.theory_sections.map((section) => (
            <div key={section.heading} style={{ marginBottom: 18 }}>
              <h3>{section.heading}</h3>
              <p>{section.body}</p>
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
          ))}
          <h3>Misollar</h3>
          {lesson.examples.map((example) => (
            <div key={example.title} className="small-card" style={{ marginBottom: 12 }}>
              <strong>{example.title}</strong>
              <p>{example.explanation}</p>
              <ol>{example.steps.map((step) => <li key={step}>{step}</li>)}</ol>
            </div>
          ))}
          <h3>Amaliy qo‘llash</h3>
          <p>{lesson.practical_application}</p>
          <h3>Xulosa</h3>
          <p>{lesson.summary}</p>
        </div>

        <div>
          <div className="surface">
            <h3 style={{ marginTop: 0 }}>Bilimni isbotlash</h3>
            <p className="muted">Odatdagi test o‘rniga bilimni isbotlash rejimlaridan birini ishga tushiring.</p>
            <div className="btn-row">
              <Link href={`/student/proof/shogird/${lesson.id}`} className="btn primary">SHOGIRD AI</Link>
              <Link href={`/student/proof/mri/${lesson.id}`} className="btn ghost">Bilim MRI</Link>
            </div>
          </div>

          <div style={{ height: 16 }} />

          <div className="surface">
            <h3 style={{ marginTop: 0 }}>AI murabbiy</h3>
            <p className="muted">Tutor tayyor javob bermaydi. Agar savol kursda yoritilgan bo‘lsa, kerakli darsga yo‘naltiradi.</p>
            <div className="chat-box">
              {messages.map((message, index) => (
                <div key={index} className={`chat-message ${message.role === "ai" ? "ai" : ""}`}>
                  <strong>{message.role === "ai" ? "Tutor" : "Siz"}</strong>
                  <div>{message.text}</div>
                  {message.references?.length ? (
                    <div style={{ marginTop: 8 }}>
                      {message.references.map((ref) => <span key={ref} className="badge" style={{ marginRight: 8 }}>{ref}</span>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <form onSubmit={handleTutor} style={{ marginTop: 14 }}>
              <textarea className="textarea" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Savolingizni yozing" />
              <div style={{ height: 12 }} />
              <button className="btn primary" disabled={busy} type="submit">{busy ? "Tutor yozmoqda..." : "Murabbiydan so‘rash"}</button>
            </form>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
