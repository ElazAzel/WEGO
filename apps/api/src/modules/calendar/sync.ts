import type { CalendarAdapter, CanonicalCalendarEvent, ExternalCalendarEvent } from "./types";

export type SyncConflict = { eventId: string; sourceOwner: "wego" | "external"; losingPatch: Partial<CanonicalCalendarEvent>; reason: "etag_mismatch" | "concurrent_update" };
export type SyncState = { external: Map<string, ExternalCalendarEvent>; conflicts: SyncConflict[]; cursor: string | null };
export function createSyncState(): SyncState { return { external: new Map(), conflicts: [], cursor: null }; }
export function hashEvent(event: Pick<CanonicalCalendarEvent, "title" | "start" | "end" | "allDay" | "timezone" | "recurrence" | "exceptionDates">): string { return JSON.stringify([event.title, event.start, event.end, event.allDay, event.timezone, event.recurrence, event.exceptionDates]); }
export async function syncConnection(adapter: CalendarAdapter, canonical: CanonicalCalendarEvent[], state: SyncState, now = new Date().toISOString()) {
  const delta = await adapter.readChanges(state.cursor);
  for (const deleted of delta.deletedExternalIds) state.external.delete(deleted);
  for (const external of delta.events) {
    const existing = state.external.get(external.externalId);
    if (existing && existing.etag && external.etag && existing.etag !== external.etag && hashEvent(existing) !== hashEvent(external)) state.conflicts.push({ eventId: external.id, sourceOwner: "external", losingPatch: existing, reason: "etag_mismatch" });
    state.external.set(external.externalId, external);
  }
  state.cursor = delta.nextCursor;
  return { imported: delta.events.length, deleted: delta.deletedExternalIds.length, conflicts: state.conflicts.length, syncedAt: now };
}
export async function publishEvent(adapter: CalendarAdapter, event: CanonicalCalendarEvent, state: SyncState) {
  const previous = [...state.external.values()].find(candidate => candidate.id === event.id) ?? null;
  const result = await adapter.write(event, previous);
  state.external.set(result.externalId, result);
  return result;
}
