import type { Zone, AlertItem, FieldReport, Road } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function getDashboard(): Promise<Zone[]> {
  const data = await fetchJson<Zone[] | { status: string }>("/api/dashboard");
  if (Array.isArray(data)) return data;
  return [];
}

export async function getAlerts(): Promise<AlertItem[]> {
  return fetchJson<AlertItem[]>("/api/alerts");
}

export async function getReports(): Promise<FieldReport[]> {
  return fetchJson<FieldReport[]>("/api/reports");
}

export async function getRoads(): Promise<Road[]> {
  return fetchJson<Road[]>("/api/roads");
}

export async function runAssessment(): Promise<{ message: string }> {
  return fetchJson("/api/run-now");
}

export async function submitReport(body: {
  reporter?: string;
  type: string;
  lat?: number;
  lon?: number;
  notes?: string;
}): Promise<{ success: boolean; id: number }> {
  return fetchJson("/api/report", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function scoreClass(score: number): string {
  if (score >= 80) return "danger";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "normal";
}

export function scoreLevelText(score: number): string {
  if (score >= 80) return "🔴 DANGEROUS";
  if (score >= 70) return "🟠 HIGH";
  if (score >= 50) return "🟡 MEDIUM";
  return "🟢 NORMAL";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#ff3b3b";
  if (score >= 70) return "#ff8c00";
  if (score >= 50) return "#f5c400";
  return "#2ecc71";
}
