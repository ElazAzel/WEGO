import { describe, expect, it } from "vitest";
import { createInitialWorld, reduceWorld } from "../index";

describe("shared world commands", () => {
  it("creates a shared plan and records each member completion once", () => {
    const created = reduceWorld(createInitialWorld(), {
      id: "create-plan-1", type: "plan_create", actorId: "u1", planId: "plan-1", title: "Ночной пикник", date: "2026-09-04", at: "2026-08-31T10:00:00.000Z",
    });
    const first = reduceWorld(created.snapshot, { id: "complete-u1", type: "plan_complete", actorId: "u1", planId: "plan-1", at: "2026-09-04T18:00:00.000Z" });
    const second = reduceWorld(first.snapshot, { id: "complete-u2", type: "plan_complete", actorId: "u2", planId: "plan-1", at: "2026-09-04T18:02:00.000Z" });

    expect(created.snapshot.plans[0]).toMatchObject({ id: "plan-1", title: "Ночной пикник", createdBy: "u1", completedBy: [] });
    expect(second.snapshot.plans[0].completedBy).toEqual(["u1", "u2"]);
  });

  it("stores a user-authored memory in the shared timeline", () => {
    const result = reduceWorld(createInitialWorld(), {
      id: "memory-command-1", type: "memory", actorId: "u1", memoryId: "memory-1", title: "Наш дождь", body: "Гуляли без зонта.", memoryKind: "note", at: "2026-08-31T10:00:00.000Z",
    });

    expect(result.snapshot.memories[0]).toMatchObject({ id: "memory-1", title: "Наш дождь", body: "Гуляли без зонта.", kind: "note" });
  });
});
