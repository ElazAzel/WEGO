import { describe, expect, it } from "vitest";
import { buildRevealViewModel, canReveal } from "./reveal";

describe("reveal rules", () => {
  it("unlocks only when both participants have answered", () => {
    expect(canReveal({ myMood: "good", partnerMood: "calm" })).toBe(true);
    expect(canReveal({ myMood: "good", partnerMood: null })).toBe(false);
  });

  it("marks a guess correct when it matches the partner mood", () => {
    const view = buildRevealViewModel(
      {
        date: "2026-08-27",
        my: { date: "2026-08-27", mood: "good", energy: "mid", want: "together", note: null },
        partner: { date: "2026-08-27", mood: "calm", energy: "low", want: "together", note: null },
        myGuess: "calm",
        partnerGuess: "good",
      },
      { meName: "Ильяс", partnerName: "Аружан" },
    );
    expect(view.guess).toEqual({ selected: "calm", correct: true });
  });
});
