import { describe, expect, it } from "vitest";
import { getRetryDelay } from "./offline-queue";

describe("offline retry schedule", () => {
  it("uses capped exponential backoff", () => {
    expect(getRetryDelay(0)).toBe(1000);
    expect(getRetryDelay(3)).toBe(8000);
    expect(getRetryDelay(8)).toBe(30000);
  });
});
