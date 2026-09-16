import { describe, expect, it } from "vitest";
import { defaultRoomEnvironment } from "@wego/domain";
import { roomInteractionFor, roomSprites, roomSpriteAsset } from "./room-sprite-manifest";

describe("room sprite manifest", () => {
  it("keeps every room prop as a unique v3 transparent asset", () => {
    const ids = roomSprites.map((sprite) => sprite.id);
    const sources = roomSprites.map((sprite) => sprite.src);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sources).size).toBe(sources.length);
    expect(roomSprites).toHaveLength(7);
    expect(sources.every((src) => src.startsWith("/assets/rooms/v3/props/"))).toBe(true);
    expect(sources.every((src) => src.endsWith(".png"))).toBe(true);
  });

  it("maps interactive props to an action that can be handled by the world store", () => {
    const interactive = roomSprites.filter((sprite) => sprite.interactive);

    expect(interactive.length).toBeGreaterThanOrEqual(4);
    expect(interactive.every((sprite) => sprite.action)).toBe(true);
    expect(interactive.map((sprite) => sprite.action)).toEqual(expect.arrayContaining(["feed", "play", "tidy", "decorate"]));
  });

  it("returns the asset path by stable sprite id", () => {
    expect(roomSpriteAsset("sofa")).toBe("/assets/rooms/v3/props/sofa-cozy.png");
    expect(roomSpriteAsset("bowl")).toBe("/assets/rooms/v3/props/bowl-food.png");
    expect(roomSpriteAsset("plants")).toBe("/assets/rooms/v3/props/plants-cozy.png");
  });

  it("returns state layers and context-aware room actions", () => {
    expect(roomSpriteAsset("curtains-closed")).toContain("curtains-closed");
    expect(roomSpriteAsset("tea-set")).toContain("tea-set");
    expect(roomInteractionFor("lamp", defaultRoomEnvironment())).toEqual({ objectId: "lamp", interaction: "toggle" });
    expect(roomInteractionFor("table", { ...defaultRoomEnvironment(), table: "tea-ready" })).toEqual({ objectId: "table", interaction: "collect-tea" });
  });
});
