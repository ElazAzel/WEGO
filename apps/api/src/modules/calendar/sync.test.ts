import { describe, expect, it } from "vitest";
import { createSyncState, hashEvent, syncConnection } from "./sync";
import { providerCapabilities, type CalendarAdapter } from "./types";

const event = { id: "e", spaceId: "s", title: "Ужин", start: "2026-09-15T19:00:00+05:00", end: "2026-09-15T20:00:00+05:00", allDay: false, timezone: "Asia/Almaty", recurrence: [], exceptionDates: [], ownerUserId: "alice", updatedAt: "2026-09-15T10:00:00.000Z" };
describe("calendar sync policy", () => {
  it("keeps provider identity, cursor and detects an etag conflict", async () => {
    const adapter: CalendarAdapter = { capabilities: () => providerCapabilities.google, discoverCalendars: async () => [], readChanges: async () => ({ events: [{ ...event, externalId: "g1", etag: "new", title: "Другое" }], deletedExternalIds: [], nextCursor: "2" }), write: async () => ({ ...event, externalId: "g1" }), remove: async () => undefined, renewSubscription: async () => ({ expiresAt: "2026-09-16T00:00:00Z" }) };
    const state = createSyncState(); state.external.set("g1", { ...event, externalId: "g1", etag: "old" });
    expect(await syncConnection(adapter, [event], state)).toMatchObject({ imported: 1, conflicts: 1 });
    expect(state.cursor).toBe("2");
  });
  it("uses all canonical fields in loop suppression hash", () => {
    expect(hashEvent(event)).not.toBe(hashEvent({ ...event, timezone: "UTC" }));
    expect(providerCapabilities.outlook.notes[0]).toContain("основного");
  });
});
