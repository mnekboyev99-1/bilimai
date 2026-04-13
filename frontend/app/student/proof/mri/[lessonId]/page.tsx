"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiGet, apiPost, ApiError } from "@/services/api";
import { LessonDetail } from "@/types";

type Edge = { id: string; source: string; target: string; label: string };
type StartResponse = { session_id: number; nodes: string[]; candidate_edges: Edge[] };
type GradeResponse = {
  session_id: number;
  understanding: "tushundi" | "qisman" | "tushunmadi";
  mastery_score: number;
  correct_edge_ids: string[];
  missing_edge_ids: string[];
  wrong_edge_ids: string[];
  explanation: string;
};

export default function MriPage() {
  const { session, loading } = useSessionGuard("student");
  const params = useParams<{ lessonId: string }>();
  const lessonId = Number(params.lessonId);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<string[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiGet<LessonDetail>(`/lessons/${lessonId}`),
      apiPost<StartResponse>("/ai/mri/start", { lesson_id: lessonId })
    ]).then(([lessonData, start]) => {
      setLesson(lessonData);
      setSessionId(start.session_id);
      setNodes(start.nodes);
      setEdges(start.candidate_edges);
    }).catch((err) => setError(err instanceof ApiError ? err.message : "Bilim MRI ishga tushmadi."));
  }, [session, lessonId]);

  async function handleGrade() {
    if (!sessionId) return;
    setBusy(true);
    setError("");
    try {
      const response = await apiPost<GradeResponse>("/ai/mri/grade", { session_id: sessionId, selected_edge_ids: selected });
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bilim MRI tekshiruvi amalga oshmadi.");
    } finally {
      setBusy(false);
    }
  }

  function toggleEdge(edgeId: string) {
    setSelected((prev) => prev.includes(edgeId) ? prev.filter((id) => id !== edgeId) : [...prev, edgeId]);
  }

  if (loading || !session || !lesson) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title="Bilim MRI" subtitle={lesson.title}>
      {error ? <div className="notice error">{error}</div> : null}

      <div className="grid-2">
        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Bilim xaritasini qayta yig‘ing</h2>
          <p className="muted">Quyidagi tushunchalar orasidagi to‘g‘ri bog‘lanishlarni tanlang. Tizim sizning ichki bilim strukturangizni tekshiradi.</p>
          <div className="btn-row" style={{ marginBottom: 16 }}>
            {nodes.map((node) => <span className="badge" key={node}>{node}</span>)}
          </div>
          <div className="edge-grid">
            {edges.map((edge) => (
              <label className="edge-card" key={edge.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(edge.id)}
                  onChange={() => toggleEdge(edge.id)}
                  style={{ marginRight: 8 }}
                />
                <strong>{edge.source}</strong> → <strong>{edge.target}</strong>
                <div className="muted" style={{ marginTop: 6 }}>{edge.label}</div>
              </label>
            ))}
          </div>
          <div style={{ height: 16 }} />
          <button className="btn primary" onClick={handleGrade} disabled={busy}>
            {busy ? "Tekshirilmoqda..." : "Bilim MRI ni tekshirish"}
          </button>
        </div>

        <div className="surface">
          <h2 style={{ marginTop: 0 }}>Natija</h2>
          {!result ? (
            <p className="muted">Tanlangan bog‘lanishlarni yuborganingizdan keyin tahlil shu yerda ko‘rinadi.</p>
          ) : (
            <>
              <div className={`notice ${result.mastery_score >= 80 ? "success" : ""}`}>
                Holat: <strong>{result.understanding}</strong> · Isbot balli: <strong>{Math.round(result.mastery_score)}</strong>
              </div>
              <p>{result.explanation}</p>
              <div className="small-card">
                <strong>To‘g‘ri tanlanganlar</strong>
                <div className="muted">{result.correct_edge_ids.join(", ") || "Yo‘q"}</div>
              </div>
              <div style={{ height: 12 }} />
              <div className="small-card">
                <strong>Yo‘qolgan bog‘lanishlar</strong>
                <div className="muted">{result.missing_edge_ids.join(", ") || "Yo‘q"}</div>
              </div>
              <div style={{ height: 12 }} />
              <div className="small-card">
                <strong>Noto‘g‘ri tanlovlar</strong>
                <div className="muted">{result.wrong_edge_ids.join(", ") || "Yo‘q"}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
