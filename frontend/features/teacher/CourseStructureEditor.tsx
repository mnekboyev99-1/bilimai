"use client";

import { useMemo, useState } from "react";

export function CourseStructureEditor({
  initialOutline,
  onSave,
  onGenerateContent,
  busy
}: {
  initialOutline: any;
  onSave: (outline: any) => Promise<void>;
  onGenerateContent: () => Promise<void>;
  busy: boolean;
}) {
  const [outline, setOutline] = useState<any>(JSON.parse(JSON.stringify(initialOutline)));

  function updateModule(index: number, patch: any) {
    const next = { ...outline };
    next.modules[index] = { ...next.modules[index], ...patch };
    setOutline(next);
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, patch: any) {
    const next = { ...outline };
    next.modules[moduleIndex].lessons[lessonIndex] = { ...next.modules[moduleIndex].lessons[lessonIndex], ...patch };
    setOutline(next);
  }

  function addModule() {
    const next = { ...outline };
    next.modules.push({
      title: `Yangi modul ${next.modules.length + 1}`,
      summary: "",
      learning_outcomes: [],
      lessons: [{ title: "Yangi dars", goal: "", estimated_minutes: 20, format_hint: "qadam-baqadam" }]
    });
    setOutline(next);
  }

  function deleteModule(moduleIndex: number) {
    const next = { ...outline };
    next.modules.splice(moduleIndex, 1);
    setOutline(next);
  }

  function addLesson(moduleIndex: number) {
    const next = { ...outline };
    next.modules[moduleIndex].lessons.push({ title: "Yangi dars", goal: "", estimated_minutes: 20, format_hint: "qadam-baqadam" });
    setOutline(next);
  }

  function deleteLesson(moduleIndex: number, lessonIndex: number) {
    const next = { ...outline };
    next.modules[moduleIndex].lessons.splice(lessonIndex, 1);
    setOutline(next);
  }

  const topicTags = useMemo(() => outline.extracted_topics || [], [outline]);

  return (
    <div className="surface">
      <h2 style={{ marginTop: 0 }}>Kurs strukturasi</h2>
      <div className="muted" style={{ marginBottom: 16 }}>
        AI yaratgan strukturani tahrir qiling, so‘ng saqlab, kontent generatsiyasini ishga tushiring.
      </div>

      <div className="form-grid">
        <div>
          <label className="label">Kurs nomi</label>
          <input className="input" value={outline.course_title || ""} onChange={(e) => setOutline({ ...outline, course_title: e.target.value })} />
        </div>
        <div>
          <label className="label">Maqsadli auditoriya</label>
          <input className="input" value={outline.target_audience || ""} onChange={(e) => setOutline({ ...outline, target_audience: e.target.value })} />
        </div>
      </div>

      {topicTags.length ? (
        <div style={{ marginTop: 16 }}>
          {topicTags.map((topic: string) => <span className="badge" style={{ marginRight: 8, marginBottom: 8 }} key={topic}>{topic}</span>)}
        </div>
      ) : null}

      <hr className="divider" />

      {outline.modules?.map((module: any, moduleIndex: number) => (
        <div className="surface soft" key={moduleIndex} style={{ marginBottom: 18 }}>
          <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Modul {moduleIndex + 1}</h3>
            <button className="btn danger" type="button" onClick={() => deleteModule(moduleIndex)}>Modulni o‘chirish</button>
          </div>

          <div className="form-grid">
            <div>
              <label className="label">Modul nomi</label>
              <input className="input" value={module.title || ""} onChange={(e) => updateModule(moduleIndex, { title: e.target.value })} />
            </div>
            <div>
              <label className="label">Qisqacha mazmun</label>
              <input className="input" value={module.summary || ""} onChange={(e) => updateModule(moduleIndex, { summary: e.target.value })} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label className="label">O‘quv natijalari (har qatorda bittadan)</label>
            <textarea
              className="textarea"
              value={(module.learning_outcomes || []).join("\n")}
              onChange={(e) => updateModule(moduleIndex, { learning_outcomes: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            {module.lessons?.map((lesson: any, lessonIndex: number) => (
              <div className="small-card" key={lessonIndex} style={{ marginBottom: 12 }}>
                <div className="btn-row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
                  <strong>Dars {lessonIndex + 1}</strong>
                  <button className="btn danger" type="button" onClick={() => deleteLesson(moduleIndex, lessonIndex)}>Darsni o‘chirish</button>
                </div>
                <div className="form-grid three">
                  <div>
                    <label className="label">Dars nomi</label>
                    <input className="input" value={lesson.title || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { title: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Maqsad</label>
                    <input className="input" value={lesson.goal || ""} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { goal: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Daqiqa</label>
                    <input className="input" type="number" value={lesson.estimated_minutes || 20} onChange={(e) => updateLesson(moduleIndex, lessonIndex, { estimated_minutes: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn ghost" type="button" onClick={() => addLesson(moduleIndex)}>Dars qo‘shish</button>
        </div>
      ))}

      <div className="btn-row">
        <button className="btn" type="button" onClick={addModule}>Modul qo‘shish</button>
        <button className="btn primary" type="button" disabled={busy} onClick={() => onSave(outline)}>
          {busy ? "Saqlanmoqda..." : "Strukturani saqlash"}
        </button>
        <button className="btn primary" type="button" disabled={busy} onClick={onGenerateContent}>
          {busy ? "Ishlanmoqda..." : "Kontentni yaratish"}
        </button>
      </div>
    </div>
  );
}
