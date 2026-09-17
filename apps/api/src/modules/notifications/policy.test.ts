import { describe, expect, it } from "vitest";
import { isQuietHour, planNotification, retryNotification } from "./policy";
const preference = { category: "task" as const, enabled: true, telegram: true, webPush: false, quietFrom: "22:00", quietTo: "08:00", timezone: "Asia/Almaty", hidePreview: true };
describe("notification policy", () => {
  it("does not enqueue during quiet hours or after expiry", () => {
    const night = new Date("2026-09-15T18:00:00.000Z");
    expect(isQuietHour(night, preference)).toBe(true);
    expect(planNotification({ id: "1", userId: "u", category: "task", title: "T", body: "B", dueAt: "2026-09-15T19:00:00Z", expiresAt: "2026-09-15T17:00:00Z" }, preference, night)).toBeNull();
  });
  it("bounds retries and keeps transport policy separate from inbox state", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    const job = { id: "1", userId: "u", category: "task" as const, title: "T", body: "B", dueAt: "2026-09-15T10:00:00Z", expiresAt: "2026-09-16T10:00:00Z", attempts: 4, transports: ["telegram"] as ("telegram" | "webpush")[] };
    expect(retryNotification(job, now)?.attempts).toBe(5);
    expect(retryNotification({ ...job, attempts: 5 }, now)).toBeNull();
  });
});
