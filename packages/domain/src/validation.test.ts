import { describe, expect, it } from "vitest";
import { validateCheckin, validateSpaceName } from "./validation";

describe("space name validation", () => {
  it("accepts a trimmed name from 1 to 24 characters", () => {
    expect(validateSpaceName("  Our Wego  ").success).toBe(true);
    expect(validateSpaceName("x".repeat(24)).success).toBe(true);
  });

  it("rejects empty and overlong names", () => {
    expect(validateSpaceName("   ").success).toBe(false);
    expect(validateSpaceName("x".repeat(25)).success).toBe(false);
  });
});

describe("check-in validation", () => {
  it("accepts the complete check-in and trims its note", () => {
    const result = validateCheckin({
      mood: "good",
      energy: "mid",
      want: "together",
      note: "  Просто рядом  ",
      clientMutationId: "mutation-1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe("Просто рядом");
  });

  it("rejects invalid moods and notes over 240 characters", () => {
    expect(validateCheckin({ mood: "unknown", energy: "mid", want: "talk", note: "", clientMutationId: "1" }).success).toBe(false);
    expect(validateCheckin({ mood: "good", energy: "mid", want: "talk", note: "x".repeat(241), clientMutationId: "1" }).success).toBe(false);
  });
});
