"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiPost, ApiError } from "@/services/api";
import { roleHome, saveSession } from "@/services/auth";
import { SessionData } from "@/types";
import { LoadingState } from "@/components/Loading";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("teacher@bilimai.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await apiPost<SessionData & { token_type: string }>("/auth/login", { email, password });
      saveSession({ token: data.access_token, user: data.user });
      router.replace(roleHome(data.user.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirish amalga oshmadi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="surface" onSubmit={handleSubmit}>
      <h2 style={{ marginTop: 0 }}>Tizimga kirish</h2>
      <p className="muted">Har bir rol uchun alohida tajriba mavjud. Tizim rolingizga qarab kerakli sahifaga yo‘naltiradi.</p>
      <label className="label">Email</label>
      <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ height: 12 }} />
      <label className="label">Parol</label>
      <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div style={{ height: 16 }} />
      {error ? <div className="notice error">{error}</div> : null}
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Kirilmoqda..." : "Kirish"}
      </button>
      <div style={{ height: 12 }} />
      {busy ? <LoadingState label="Sessiya yaratilmoqda..." /> : null}
      <div style={{ height: 12 }} />
      <div className="muted" style={{ fontSize: 13 }}>
        Demo foydalanuvchilar: teacher@bilimai.local / student@bilimai.local / parent@bilimai.local
      </div>
    </form>
  );
}
