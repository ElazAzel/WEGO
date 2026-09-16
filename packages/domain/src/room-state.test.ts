import { describe, expect, it } from "vitest";
import { normalizeRoomState } from "./room-state";

describe("room state normalization", () => {
  it("fills environment and equipment for a legacy snapshot", () => {
    const result = normalizeRoomState({ unlockedItemIds: ["everyday", "everyday"], outfitId: "sunny-scarf" });

    expect(result.environment).toEqual({ lamp: "on", curtains: "open", table: "empty", plants: "healthy", window: "quiet" });
    expect(result.equippedRoomItems).toEqual({ sofa: null, rug: null, lamp: null, table: null, shelf: null, plants: null, wall: null });
    expect(result.equippedWegoItems).toEqual({ outfit: "sunny-scarf", accessory: null, emotion: null });
    expect(result.unlockedItemIds).toEqual(["everyday", "sunny-scarf"]);
  });

  it("rejects unknown environment values and equipment slots", () => {
    const result = normalizeRoomState({ environment: { lamp: "broken", curtains: "closed" }, equippedRoomItems: { lamp: "coral-lamp", unknown: "hack" } });

    expect(result.environment.lamp).toBe("on");
    expect(result.environment.curtains).toBe("closed");
    expect(result.equippedRoomItems).toEqual({ sofa: null, rug: null, lamp: "coral-lamp", table: null, shelf: null, plants: null, wall: null });
    expect(result.equippedRoomItems).not.toHaveProperty("unknown");
  });
});
