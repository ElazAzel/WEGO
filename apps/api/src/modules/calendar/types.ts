export type CalendarProvider = "google" | "outlook" | "icloud" | "yandex";
export type CalendarVisibility = "busy" | "details";
export type CalendarDirection = "read" | "write";
export type CanonicalCalendarEvent = { id: string; spaceId: string; title: string; start: string; end: string; allDay: boolean; timezone: string; recurrence: string[]; exceptionDates: string[]; description?: string; updatedAt: string; ownerUserId: string };
export type ExternalCalendarEvent = CanonicalCalendarEvent & { externalId: string; etag?: string; providerFields?: Record<string, unknown> };
export type CalendarConnection = { id: string; userId: string; provider: CalendarProvider; externalCalendarId: string; directions: CalendarDirection[]; visibility: CalendarVisibility; encryptedSecretRef: string; syncCursor: string | null; lastSyncedAt: string | null; status: "active" | "reauthorization_required" | "disconnected" };
export type ProviderCapabilities = { provider: CalendarProvider; canRead: boolean; canWrite: boolean; canRecurring: boolean; supportsDelta: boolean; supportsWebhooks: boolean; notes: string[] };
export interface CalendarAdapter {
  capabilities(): ProviderCapabilities;
  discoverCalendars(): Promise<Array<{ id: string; name: string; canWrite: boolean }>>;
  readChanges(cursor: string | null): Promise<{ events: ExternalCalendarEvent[]; deletedExternalIds: string[]; nextCursor: string | null }>;
  write(event: CanonicalCalendarEvent, previous: ExternalCalendarEvent | null): Promise<ExternalCalendarEvent>;
  remove(event: ExternalCalendarEvent): Promise<void>;
  renewSubscription(): Promise<{ expiresAt: string } | null>;
}

export const providerCapabilities: Record<CalendarProvider, ProviderCapabilities> = {
  google: { provider: "google", canRead: true, canWrite: true, canRecurring: true, supportsDelta: true, supportsWebhooks: true, notes: ["syncToken используется после полного чтения", "watch требует продления"] },
  outlook: { provider: "outlook", canRead: true, canWrite: true, canRecurring: true, supportsDelta: true, supportsWebhooks: true, notes: ["delta гарантирован только для основного /me/calendarView в Graph v1.0", "дополнительные календари сверяются постранично"] },
  icloud: { provider: "icloud", canRead: true, canWrite: true, canRecurring: true, supportsDelta: false, supportsWebhooks: false, notes: ["CalDAV и пароль приложения", "контрольная сверка каждые пять минут"] },
  yandex: { provider: "yandex", canRead: true, canWrite: true, canRecurring: true, supportsDelta: false, supportsWebhooks: false, notes: ["CalDAV и пароль приложения", "контрольная сверка с backoff"] },
};
