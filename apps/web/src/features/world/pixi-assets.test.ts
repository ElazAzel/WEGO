import { describe, expect, it, vi } from "vitest";

vi.mock("pixi.js", () => ({ Assets: { load: vi.fn() } }));

import { loadPixiTextures } from "./pixi-assets";

describe("loadPixiTextures", () => {
  it("loads every source before exposing the named textures", async () => {
    const loaded = {
      "/room.png": { id: "background" },
      "/wego.png": { id: "wego" },
    };
    const load = vi.fn(async () => loaded);

    const result = await loadPixiTextures({
      background: "/room.png",
      wego: "/wego.png",
    }, load);

    expect(load).toHaveBeenCalledWith(["/room.png", "/wego.png"]);
    expect(result).toEqual({ background: loaded["/room.png"], wego: loaded["/wego.png"] });
  });
});
