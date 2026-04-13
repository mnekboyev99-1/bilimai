"use client";

import { getSession } from "@/services/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

async function parseResponse(response: Response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new ApiError(data.detail || "So‘rov bajarilmadi.", response.status);
  }
  return data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
    cache: "no-store"
  });
  return parseResponse(response);
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

export async function apiPut<T>(path: string, body: any): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const session = getSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
    body: formData
  });
  return parseResponse(response);
}
