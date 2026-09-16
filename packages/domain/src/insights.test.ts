import { describe, expect, it } from "vitest";
import { deriveInsight } from "./insights";

describe("insight rules", () => {
  it("returns the connection insight for different energy and shared want", () => {
    expect(deriveInsight({ myMood: "good", myEnergy: "high", myWant: "together", partnerMood: "calm", partnerEnergy: "low", partnerWant: "together" }).text)
      .toContain("разный запас энергии");
  });

  it("returns a neutral deterministic fallback for incomplete data", () => {
    expect(deriveInsight({ myMood: "good", myEnergy: null, myWant: null, partnerMood: null, partnerEnergy: null, partnerWant: null }).key)
      .toBe("neutral");
  });
});
