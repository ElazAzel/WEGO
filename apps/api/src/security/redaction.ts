const sensitive = new Set(["initData", "note", "inviteToken", "token", "authorization"]);

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sensitive.has(key) ? "[REDACTED]" : redactSensitive(entry)]));
}
