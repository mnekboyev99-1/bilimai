"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, apiPost, ApiError } from "@/services/api";
import { LessonDetail } from "@/types";

type StartResponse = { session_id: number; ai_message: string; status: "active"; persona_name: string };
type TurnResponse = {
  session_id: number;
  status: "continue" | "pass" | "fail";
  ai_message: string;
  understanding: "tushundi" | "qisman" | "tushunmadi";
  mastery_score: number;
  weak_spots: string[];
  what_to_review: string[];
};

export default function ShogirdPage() {
  const { session, loading } = useSessionGuard("student");
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<TurnResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiGet<LessonDetail>(`/lessons/${lessonId}`),
      apiPost<StartResponse>("/ai/shogird/start", { lesson_id: lessonId })
    ]).then(([lessonData, start]) => {
      setLesson(lessonData);
      setSessionId(start.session_id);
      setMessages([{ role: "ai", text: start.ai_message }]);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "SHOGIRD AI ishga tushmadi."));
  }, [session, lessonId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!answer.trim() || !sessionId) return;
    const studentMessage = answer;
    setAnswer("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", text: studentMessage }]);
    try {
      const response = await apiPost<TurnResponse>("/ai/shogird/respond", { session_id: sessionId, student_message: studentMessage });
      setMessages((prev) => [...prev, { role: "ai", text: response.ai_message }]);
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Javob tekshirilmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session || !lesson) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title="SHOGIRD AI" subtitle={lesson.title}>
      {error ? <div className="notice error">{error}</div> : null}

      <div className="grid-2">
        <div className="surface">
          <h2 style={{ marginTop: 0 }}>AI-o‘quvchini o‘qiting</h2>
          <p className="muted">AI ataylab chalkashadi. Siz mavzuni tushuntirib, uning xatolarini tuzatishingiz kerak.</p>
          <div className="chat-box">
            {messages.map((message, index) => (
              <div key={index} className={`chat-message ${message.role === "ai" ? "ai" : ""}`}>
                <strong>{message.role === "ai" ? "SHOGIRD AI" : "Siz"}</strong>
                <div>{message.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={{ marginTop: 14 }}>
            <textarea className="textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Mavzuni tushuntiring..." />
            <div style={{ height: 12 }} />
            <button className="btn primary" disabled={busy} type="submit">{busy ? "Tekshirilmoqda..." : "Tushuntirishni yuborish"}</button>
          </form>
        </div>

        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Natija</h2>
          {!result ? <p className="muted">Tushuntirishdan keyin bu yerda mastery natijasi paydo bo‘ladi.</p> : (
            <>
              <div className={`notice ${result.status === "pass" ? "success" : ""}`}>
                Holat: <strong>{result.understanding}</strong> · Isbot balli: <strong>{Math.round(result.mastery_score)}</strong>
              </div>
              <h3>Qayta ko‘rish kerak bo‘lgan joylar</h3>
              <ul>{result.what_to_review.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>Zaif joylar</h3>
              <ul>{result.weak_spots.map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
