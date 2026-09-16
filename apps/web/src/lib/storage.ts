export const LOCAL_STATE_KEY = "wego-production-state-v1";

export function readLocalState<T>(fallback: T): T {
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocalState<T>(value: T): void {
  try { window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(value)); } catch { /* storage is optional */ }
}
