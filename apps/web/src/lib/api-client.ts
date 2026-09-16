import { getTelegramContext } from "./telegram";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = "API_ERROR") { super(message); }
}

export const apiBaseUrl = (import.meta.env.VITE_API_URL || "/v1").replace(/\/$/, "");
const sessionKey = "wego-api-session-v1";

export type ApiSession = { user: { id: string; name: string; tone: "coral" | "lilac" }; token: string };

export function isApiEnabled(): boolean {
  // Telegram can open the hosted demo before a backend is configured. Keep that
  // path local-first instead of making every Telegram launch call a missing /v1.
  return import.meta.env.VITE_API_ENABLED === "true" || (import.meta.env.DEV && getTelegramContext().isTelegram);
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function getToken(): string | null {
  try { return window.sessionStorage.getItem(sessionKey); } catch { return null; }
}

function setToken(token: string): void {
  try { window.sessionStorage.setItem(sessionKey, token); } catch { /* session storage is optional */ }
}

export async function authenticateTelegram(): Promise<ApiSession["user"]> {
  const current = getTelegramContext();
  const result = await apiFetch<ApiSession>("/auth/telegram", { method: "POST", body: JSON.stringify({ initData: current.initData }) }, false);
  // Keep the returned bearer as a fallback for cross-origin API deployments
  // where an HttpOnly cookie cannot be shared with the Vercel origin.
  setToken(result.token);
  return result.user;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}, withSession = true): Promise<T> {
  const token = withSession ? getToken() : null;
  const headers = new Headers(options.headers);
  if (options.body !== undefined && options.body !== null) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(apiUrl(path), { credentials: "include", ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string; code?: string } } | null;
    throw new ApiError(response.status, body?.error?.message ?? "Что-то пошло не так", body?.error?.code);
  }
  return response.status === 204 ? (undefined as T) : (await response.json() as T);
}
