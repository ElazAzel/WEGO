import { describe, expect, it } from "vitest";
import { createInitialWorld } from "@wego/domain";
import { InMemoryWorldState } from "./world-state";

describe("InMemoryWorldState", () => {
  it("applies one command, replays it idempotently and rejects a stale command", () => {
    const state = new InMemoryWorldState(() => createInitialWorld("2026-08-31T10:00:00.000Z"));
    const action = { id: "cmd-lamp", type: "room_interact" as const, actorId: "member-a", objectId: "lamp" as const, interaction: "toggle" as const, at: "2026-08-31T10:01:00.000Z" };

    const first = state.execute("space-1", { commandId: "cmd-lamp", expectedRevision: 0, action });
    const replay = state.execute("space-1", { commandId: "cmd-lamp", expectedRevision: 0, action });
    const stale = state.execute("space-1", { commandId: "cmd-window", expectedRevision: 0, action: { ...action, id: "cmd-window", objectId: "window", interaction: "toggle-curtains" } });

    expect(first.status).toBe("applied");
    expect(first.record.revision).toBe(1);
    expect(first.record.world.environment.lamp).toBe("off");
    expect(replay.status).toBe("replayed");
    expect(replay.record.revision).toBe(1);
    expect(stale.status).toBe("conflict");
    expect(stale.record.revision).toBe(1);
  });

  it("shares one versioned world between both members of a space", () => {
    const state = new InMemoryWorldState();
    state.execute("shared-space", {
      commandId: "pet-1",
      expectedRevision: 0,
      action: { id: "pet-1", type: "pet", actorId: "member-a", objectId: "toy", at: "2026-08-31T10:01:00.000Z" },
    });

    expect(state.read("shared-space").revision).toBe(1);
    expect(state.read("shared-space").world.affection).toBeGreaterThan(12);
  });

  it("versions idempotent snapshot mutations such as equipment changes", () => {
    const state = new InMemoryWorldState();
    const update = (world: ReturnType<typeof createInitialWorld>) => ({ ...world, equippedRoomItems: { ...world.equippedRoomItems, sofa: "soft-blanket" } });

    const first = state.transform("space-1", { commandId: "equip-1", expectedRevision: 0, update });
    const replay = state.transform("space-1", { commandId: "equip-1", expectedRevision: 0, update });
    const conflict = state.transform("space-1", { commandId: "equip-2", expectedRevision: 0, update });

    expect(first.status).toBe("applied");
    expect(replay.status).toBe("replayed");
    expect(replay.record.revision).toBe(1);
    expect(conflict.status).toBe("conflict");
  });
});
