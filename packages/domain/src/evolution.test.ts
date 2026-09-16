import { describe, expect, it } from "vitest";
import { calculateEvolution } from "./evolution";

describe("evolution", () => {
  it("moves egg to baby after three consecutive shared good days", () => {
    const result = calculateEvolution("egg", ["great", "good", "great"]);
    expect(result).toEqual({ stage: "baby", streak: 3, didEvolve: true });
  });

  it("does not evolve when the streak is interrupted", () => {
    const result = calculateEvolution("egg", ["great", "hard", "great"]);
    expect(result).toEqual({ stage: "egg", streak: 1, didEvolve: false });
  });
});
