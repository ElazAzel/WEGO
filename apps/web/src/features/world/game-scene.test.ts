import { describe, expect, it } from "vitest";
import { createInitialWorld } from "@wego/domain";
import { SceneDirector, projectEquippedEntities, roomEntityManifest, roomRendererForFlag, sceneCommandForTarget, visibleRoomEntityIds, wegoVisualFrame } from "./game-scene";

describe("SceneDirector", () => {
  it("plans movement, object reaction and feedback for a lamp interaction", () => {
    const director = new SceneDirector(roomEntityManifest);
    const world = createInitialWorld("2026-08-31T10:00:00.000Z");

    const plan = director.begin({ id: "intent-1", targetId: "lamp", kind: "interact" }, world);

    expect(plan).toEqual({
      id: "intent-1",
      targetId: "lamp",
      targetAnchor: { x: 420, y: 416 },
      phases: [
        { type: "goto", state: "walking", durationMs: 520 },
        { type: "react", state: "curious", durationMs: 180 },
        { type: "effect", effect: "lamp-toggle", durationMs: 240 },
        { type: "feedback", state: "happy", durationMs: 360 },
        { type: "return", state: "idle", durationMs: 420 },
      ],
    });
  });

  it("locks the scene until the active interaction completes", () => {
    const director = new SceneDirector(roomEntityManifest);
    const world = createInitialWorld("2026-08-31T10:00:00.000Z");

    expect(director.begin({ id: "first", targetId: "table", kind: "interact" }, world)).not.toBeNull();
    expect(director.begin({ id: "second", targetId: "sofa", kind: "interact" }, world)).toBeNull();
    expect(director.complete("first")).toBe(true);
    expect(director.begin({ id: "second", targetId: "sofa", kind: "interact" }, world)).not.toBeNull();
  });
});

describe("scene equipment projection", () => {
  it("projects equipped cosmetics onto their physical room hosts", () => {
    const world = createInitialWorld("2026-08-31T10:00:00.000Z");
    world.equippedRoomItems.sofa = "soft-blanket";
    world.equippedRoomItems.table = "tea-set-berry";
    world.equippedRoomItems.lamp = "lamp-paper";

    expect(projectEquippedEntities(world)).toEqual([
      { id: "equipped-sofa", itemId: "soft-blanket", hostId: "sofa", assetId: "soft-blanket" },
      { id: "equipped-lamp", itemId: "lamp-paper", hostId: "lamp", assetId: "lamp-coral" },
      { id: "equipped-table", itemId: "tea-set-berry", hostId: "table", assetId: "tea-set" },
    ]);
  });
});

describe("scene runtime boundary", () => {
  it("keeps Wego inside the designed 176px footprint while animating", () => {
    const idle = wegoVisualFrame("idle", 0.7);
    const happy = wegoVisualFrame("happy", 0.7);

    expect(idle.width).toBeGreaterThanOrEqual(174);
    expect(idle.width).toBeLessThanOrEqual(178);
    expect(happy.width).toBeGreaterThan(idle.width);
    expect(happy.width).toBeLessThan(184);
  });

  it("uses Pixi by default and keeps the DOM renderer as an explicit fallback", () => {
    expect(roomRendererForFlag(undefined)).toBe("pixi");
    expect(roomRendererForFlag("true")).toBe("pixi");
    expect(roomRendererForFlag("false")).toBe("dom");
  });

  it("maps scene targets to the current domain interaction", () => {
    const world = createInitialWorld("2026-08-31T10:00:00.000Z");

    expect(sceneCommandForTarget("lamp", world)).toEqual({ kind: "room", interaction: { objectId: "lamp", interaction: "toggle" } });
    expect(sceneCommandForTarget("window", world)).toEqual({ kind: "room", interaction: { objectId: "window", interaction: "toggle-curtains" } });
    expect(sceneCommandForTarget("table", world)).toEqual({ kind: "room", interaction: { objectId: "table", interaction: "serve-tea" } });
    world.environment.table = "tea-ready";
    expect(sceneCommandForTarget("table", world)).toEqual({ kind: "room", interaction: { objectId: "table", interaction: "collect-tea" } });
    expect(sceneCommandForTarget("sofa", world)).toEqual({ kind: "world", action: "play", objectId: "toy" });
    expect(sceneCommandForTarget("wego", world)).toEqual({ kind: "world", action: "pet", objectId: "toy" });
  });

  it("keeps the move-in room sparse but never hides installed furniture", () => {
    const world = createInitialWorld("2026-08-31T10:00:00.000Z");
    world.cozy.roomPhase = "move-in";
    expect(visibleRoomEntityIds(world)).toEqual(["background", "window", "wego"]);

    world.cozy.roomPhase = "settled";
    world.cozy.roomBuildLevel = 1;
    expect(visibleRoomEntityIds(world)).toEqual(["background", "rug", "window", "wego"]);

    world.equippedRoomItems.sofa = "soft-blanket";
    expect(visibleRoomEntityIds(world)).toEqual(["background", "rug", "window", "sofa", "wego"]);
  });
});
