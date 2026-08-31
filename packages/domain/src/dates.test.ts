import { describe, expect, it } from "vitest";
import { getSpaceDate } from "./dates";

describe("getSpaceDate", () => {
  it("uses the space timezone at the midnight boundary", () => {
    expect(getSpaceDate(new Date("2026-08-27T18:59:59.000Z"), "Asia/Almaty")).toBe("2026-08-27");
    expect(getSpaceDate(new Date("2026-08-27T19:00:00.000Z"), "Asia/Almaty")).toBe("2026-08-28");
    expect(getSpaceDate(new Date("2026-08-27T18:59:59.000Z"), "UTC")).toBe("2026-08-27");
  });
});
