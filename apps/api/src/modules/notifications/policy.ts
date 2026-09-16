export type NotificationCategory = "task" | "calendar" | "partner" | "pet" | "system";
export type NotificationPreference = { category: NotificationCategory; enabled: boolean; telegram: boolean; webPush: boolean; quietFrom: string; quietTo: string; timezone: string; hidePreview: boolean };
export type NotificationJob = { id: string; userId: string; category: NotificationCategory; title: string; body: string; dueAt: string; expiresAt: string; attempts: number; transports: Array<"telegram" | "webpush"> };
export function isQuietHour(date: Date, preference: Pick<NotificationPreference, "quietFrom" | "quietTo" | "timezone">): boolean {
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: preference.timezone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const current = Number(time.replace(":", "")); const from = Number(preference.quietFrom.replace(":", "")); const to = Number(preference.quietTo.replace(":", ""));
  return from < to ? current >= from && current < to : current >= from || current < to;
}
export function planNotification(job: Omit<NotificationJob, "transports" | "attempts">, preference: NotificationPreference, now = new Date()): NotificationJob | null {
  if (!preference.enabled || !preference.category || !preference.enabled || new Date(job.expiresAt).getTime() <= now.getTime()) return null;
  const transports = [preference.telegram ? "telegram" : null, preference.webPush ? "webpush" : null].filter(Boolean) as NotificationJob["transports"];
  if (!transports.length || isQuietHour(now, preference)) return null;
  return { ...job, attempts: 0, transports };
}
export function retryNotification(job: NotificationJob, now = new Date()): NotificationJob | null { if (job.attempts >= 5 || new Date(job.expiresAt).getTime() <= now.getTime()) return null; return { ...job, attempts: job.attempts + 1 }; }
