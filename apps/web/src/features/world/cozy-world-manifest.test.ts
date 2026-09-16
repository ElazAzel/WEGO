import { describe, expect, it } from "vitest";
import { cozyCharacterZIndex, cozyObjectSprites } from "./cozy-world-manifest";

describe("cozy room object manifest", () => {
  it("provides eight independently positioned cozy objects", () => {
    expect(cozyObjectSprites).toHaveLength(8);
    expect(new Set(cozyObjectSprites.map((item) => item.id)).size).toBe(8);
    expect(cozyObjectSprites.every((item) => item.position.width > 0 && item.position.left >= 0 && item.position.top >= 0)).toBe(true);
  });

  it("keeps every decorative layer behind the character", () => {
    expect(cozyObjectSprites.every((item) => item.position.zIndex < cozyCharacterZIndex)).toBe(true);
  });
});
