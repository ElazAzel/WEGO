import { describe, expect, it } from "vitest";
import { createInitialWorld } from "./world";
import { reduceWorld } from "./world-reducer";

describe("room interactions", () => {
  it("toggles the lamp without changing it twice for a replayed action", () => {
    const first = reduceWorld(createInitialWorld(), { id: "lamp-1", type: "room_interact", actorId: "u1", objectId: "lamp", interaction: "toggle", at: "2026-08-27T10:00:00.000Z" });
    const replay = reduceWorld(first.snapshot, { id: "lamp-1", type: "room_interact", actorId: "u1", objectId: "lamp", interaction: "toggle", at: "2026-08-27T10:01:00.000Z" });

    expect(first.snapshot.environment.lamp).toBe("off");
    expect(first.snapshot.roomObjects.lamp.lastInteractedAt).toBe("2026-08-27T10:00:00.000Z");
    expect(replay.snapshot.environment.lamp).toBe("off");
    expect(replay.reward).toBeNull();
  });

  it("serves and collects tea at the table", () => {
    const served = reduceWorld(createInitialWorld(), { id: "tea-1", type: "room_interact", actorId: "u1", objectId: "table", interaction: "serve-tea", at: "2026-08-27T10:00:00.000Z" });
    const collected = reduceWorld(served.snapshot, { id: "tea-2", type: "room_interact", actorId: "u1", objectId: "table", interaction: "collect-tea", at: "2026-08-27T10:02:00.000Z" });

    expect(served.snapshot.environment.table).toBe("tea-ready");
    expect(collected.snapshot.environment.table).toBe("empty");
    expect(collected.message).toContain("чай");
  });
});
