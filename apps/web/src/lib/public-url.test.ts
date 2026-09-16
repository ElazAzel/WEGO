import { describe, expect, it } from "vitest";
import { withPublicBase } from "./public-url";

describe("withPublicBase", () => {
  it("keeps public assets under the GitHub Pages subpath", () => {
    expect(withPublicBase("/assets/room.png", "/WEGO/")).toBe("/WEGO/assets/room.png");
  });

  it("does not add an extra slash at the root", () => {
    expect(withPublicBase("fonts/wego.woff2", "/")).toBe("/fonts/wego.woff2");
  });
});
