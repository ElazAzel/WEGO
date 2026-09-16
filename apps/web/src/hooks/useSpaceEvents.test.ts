import { describe, expect, it } from "vitest";
import { spaceEventNeedsRefresh } from "./useSpaceEvents";

describe("spaceEventNeedsRefresh", () => {
  it("refreshes shared state for world and partner mutations", () => {
    expect(spaceEventNeedsRefresh("world_changed")).toBe(true);
    expect(spaceEventNeedsRefresh("partner_joined")).toBe(true);
    expect(spaceEventNeedsRefresh("connected")).toBe(false);
    expect(spaceEventNeedsRefresh(undefined)).toBe(false);
  });
});
