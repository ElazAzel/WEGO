import { describe, expect, it } from "vitest";
import { createInitialWorld, memoryCopyFor, normalizeCozyWorldState, reduceWorld } from "../index";

describe("Cozy World defaults", () => {
  it("normalizes a legacy snapshot into a calm room with a dated daily quest", () => {
    const cozy = normalizeCozyWorldState(undefined, "2026-08-28");

    expect(cozy.vibe).toBe("slow-morning");
    expect(cozy.roomPhase).toBe("move-in");
    expect(cozy.moveInStep).toBe("meet-wego");
    expect(cozy.dailyQuest).toMatchObject({ id: "quest-2026-08-28-ritual", status: "ready" });
    expect(cozy.memoryWall).toEqual([]);
  });

  it("starts a new world in a furnished showcase before the move-in", () => {
    expect(createInitialWorld("2026-08-28T12:00:00.000Z").cozy).toMatchObject({ roomPhase: "showcase", moveInStep: "welcome", roomBuildLevel: 6 });
  });

  it("uses warm pair-game copy for a completed night vibe", () => {
    expect(memoryCopyFor("pair-game", "night-cozy").title).toContain("Вайб");
  });
});

describe("Cozy World transitions", () => {
  it("changes the room vibe and gives Wego a party pose", () => {
    const result = reduceWorld(createInitialWorld("2026-08-28T12:00:00.000Z"), {
      id: "vibe-1", type: "set_vibe", actorId: "me", vibe: "tiny-party", at: "2026-08-28T12:00:00.000Z",
    } as never);

    expect(result.snapshot.cozy.vibe).toBe("tiny-party");
    expect(result.snapshot.cozy.pose).toBe("party");
  });

  it("creates one ritual memory and keeps the reward idempotent", () => {
    const action = { id: "ritual-1", type: "ritual", actorId: "me", ritual: "tea", at: "2026-08-28T12:00:00.000Z" } as never;
    const result = reduceWorld(createInitialWorld("2026-08-28T12:00:00.000Z"), action);

    expect(result.snapshot.memories[0]).toMatchObject({ kind: "care", title: "Вечерний чай" });
    expect(result.reward?.amount).toBeGreaterThan(0);
    expect(reduceWorld(result.snapshot, action).reward).toBeNull();
  });

  it("completes choose-vibe after both partners answer", () => {
    const first = reduceWorld(createInitialWorld("2026-08-28T12:00:00.000Z"), {
      id: "game-me", type: "game_answer", actorId: "me", gameAnswer: "night-cozy", at: "2026-08-28T12:00:00.000Z",
    } as never).snapshot;
    const complete = reduceWorld(first, {
      id: "game-partner", type: "game_answer", actorId: "partner", gameAnswer: "night-cozy", at: "2026-08-28T12:00:05.000Z",
    } as never);

    expect(complete.snapshot.cozy.game).toMatchObject({ status: "completed", result: "match" });
    expect(complete.snapshot.memories[0]?.kind).toBe("game");
  });

  it("claims the daily quest only once", () => {
    const action = { id: "quest-1", type: "quest_claim", actorId: "me", at: "2026-08-28T12:00:00.000Z" } as never;
    const result = reduceWorld(createInitialWorld("2026-08-28T12:00:00.000Z"), action);

    expect(result.snapshot.cozy.dailyQuest.status).toBe("claimed");
    expect(result.reward?.reason).toBe("daily");
    expect(reduceWorld(result.snapshot, { id: "quest-2", type: "quest_claim", actorId: "me", at: "2026-08-28T12:00:01.000Z" } as never).reward).toBeNull();
  });

  it("turns the showcase into a guided move-in and completes the first room corner", () => {
    const started = reduceWorld(createInitialWorld("2026-08-28T12:00:00.000Z"), {
      id: "move-in-start", type: "move_in_start", actorId: "me", at: "2026-08-28T12:00:01.000Z",
    } as never).snapshot;
    expect(started.cozy).toMatchObject({ roomPhase: "move-in", moveInStep: "meet-wego", roomBuildLevel: 0 });

    const met = reduceWorld(started, { id: "move-in-pet", type: "pet", actorId: "me", objectId: "toy", at: "2026-08-28T12:00:02.000Z" }).snapshot;
    expect(met.cozy.moveInStep).toBe("first-ritual");
    const ritual = reduceWorld(met, { id: "move-in-ritual", type: "ritual", actorId: "me", ritual: "tea", at: "2026-08-28T12:00:03.000Z" }).snapshot;
    expect(ritual.cozy.moveInStep).toBe("first-furniture");
    const finished = reduceWorld(ritual, { id: "move-in-rug", type: "move_in_place", actorId: "me", moveInItem: "rug", at: "2026-08-28T12:00:04.000Z" } as never).snapshot;
    expect(finished.cozy).toMatchObject({ roomPhase: "settled", moveInStep: "complete", roomBuildLevel: 1 });
  });
});
