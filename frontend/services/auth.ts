"use client";

import { SessionData, Role } from "@/types";

const STORAGE_KEY = "bilimai_session";

export function saveSession(data: SessionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function roleHome(role: Role): string {
  if (role === "teacher") return "/teacher";
  if (role === "student") return "/student";
  return "/parent";
}
