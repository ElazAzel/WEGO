import { describe, expect, it } from "vitest";
import { petIntent, petReply, petMiniGames } from "../pet";

describe("rule-based shared pet", () => {
  it("understands Russian intent keywords without an AI call", () => {
    expect(petIntent("давай поиграем вместе")).toBe("game");
    expect(petIntent("я устал(а), поддержи меня")).toBe("support");
    expect(petIntent("привет, мы вернулись")).toBe("return");
  });
  it("selects a contextual reply and avoids the immediately repeated line", () => {
    const first = petReply({ intent: "care", mood: "loved", energy: 80, recentReplyIds: [] });
    const next = petReply({ intent: "care", mood: "loved", energy: 80, recentReplyIds: [first.id] });
    expect(first.text).toBeTruthy();
    expect(next.id).not.toBe(first.id);
  });
  it("ships exactly three small games with no reward policy in the client", () => {
    expect(petMiniGames.map(game => game.id)).toEqual(["memory-pairs", "partner-choice", "shared-activity"]);
  });
});
