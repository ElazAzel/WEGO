import { describe, expect, it } from "vitest";
import { SpaceEventHub } from "./sse";

describe("SpaceEventHub", () => {
  it("publishes authorized space events and removes disconnected clients", () => {
    const hub = new SpaceEventHub();
    const first: string[] = [];
    const second: string[] = [];
    const unsubscribe = hub.subscribe("space-1", { write: (chunk) => first.push(chunk) });
    hub.subscribe("space-1", { write: (chunk) => second.push(chunk) });

    hub.publish({ type: "checkin_submitted", spaceId: "space-1", date: "2026-08-27", version: 1 });
    expect(first[0]).toContain('"type":"checkin_submitted"');
    expect(second).toHaveLength(1);

    unsubscribe();
    hub.publish({ type: "guess_saved", spaceId: "space-1", date: "2026-08-27", version: 2 });
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
  });
});
