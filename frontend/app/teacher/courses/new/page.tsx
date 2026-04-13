"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import { DashboardShell } from "@/components/DashboardShell";
import { LoadingState } from "@/components/Loading";
import { useSessionGuard } from "@/features/auth/useSessionGuard";
import { apiUpload, ApiError } from "@/services/api";
import { CourseDetail } from "@/types";

export default function NewCoursePage() {
  const { session, loading } = useSessionGuard("teacher");
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("uz");
  const [level, setLevel] = useState("o_rta");
  const [targetAudience, setTargetAudience] = useState("Talabalar");
  const [moduleCount, setModuleCount] = useState(5);
  const [lessonsPerModule, setLessonsPerModule] = useState(3);
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("prompt", prompt);
      formData.append("language", language);
      formData.append("level", level);
      formData.append("target_audience", targetAudience);
      formData.append("module_count", String(moduleCount));
      formData.append("lessons_per_module", String(lessonsPerModule));
      Array.from(files || []).forEach((file) => formData.append("files", file));
      const created = await apiUpload<CourseDetail>("/courses/generate-structure", formData);
      router.replace(`/teacher/courses/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kurs yaratilmadi.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session) return <main className="page-shell"><LoadingState /></main>;

  return (
    <DashboardShell user={session.user} title="Yangi kurs yaratish" subtitle="Fayl yoki prompt asosida AI kurs strukturasi yaratiladi">
      <form className="surface" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label className="label">Kurs nomi</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Maqsadli auditoriya</label>
            <input className="input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="form-grid four">
          <div>
            <label className="label">Til</label>
            <select className="select" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="uz">O‘zbekcha</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="label">Daraja</label>
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="boshlangich">Boshlang‘ich</option>
              <option value="o_rta">O‘rta</option>
              <option value="ilg'or">Ilg‘or</option>
            </select>
          </div>
          <div>
            <label className="label">Modullar soni</label>
            <input className="input" type="number" min={2} max={12} value={moduleCount} onChange={(e) => setModuleCount(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Har moduldagi darslar</label>
            <input className="input" type="number" min={2} max={6} value={lessonsPerModule} onChange={(e) => setLessonsPerModule(Number(e.target.value))} />
          </div>
        </div>

        <div style={{ height: 16 }} />

        <label className="label">Prompt yoki o‘quv brief</label>
        <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Kurs yo‘nalishi, auditoriya va didaktik talablarni yozing." />

        <div style={{ height: 16 }} />

        <label className="label">Manba fayllar</label>
        <input className="input" type="file" accept=".pdf,.docx,.pptx,.txt,.md" multiple onChange={(e: ChangeEvent<HTMLInputElement>) => setFiles(e.target.files)} />

        <div style={{ height: 16 }} />

        {error ? <div className="notice error">{error}</div> : null}

        <button className="btn primary" disabled={busy} type="submit">
          {busy ? "AI strukturani yaratmoqda..." : "Kurs strukturasi yaratish"}
        </button>

        <div style={{ height: 12 }} />
        {busy ? <LoadingState label="Manbalar tahlil qilinmoqda va struktura yaratilmoqda..." /> : null}
      </form>
    </DashboardShell>
  );
}
