import { describe, expect, it } from "vitest";
import { canEquipItem, getCatalogItem } from "./items";

describe("cosmetic catalog", () => {
  it("maps room purchases to a compatible room slot", () => {
    expect(canEquipItem("soft-blanket", { type: "room", slot: "sofa" })).toBe(true);
    expect(canEquipItem("soft-blanket", { type: "room", slot: "lamp" })).toBe(false);
  });

  it("keeps paid cosmetics separate from free outfit defaults", () => {
    const item = getCatalogItem("sunny-scarf");

    expect(item?.kind).toBe("outfit");
    expect(item?.assetId).toBeTruthy();
    expect(item?.starsPrice).toBeGreaterThan(0);
  });

  it("offers installable room details for the table and lamp", () => {
    expect(canEquipItem("tea-set-berry", { type: "room", slot: "table" })).toBe(true);
    expect(canEquipItem("lamp-paper", { type: "room", slot: "lamp" })).toBe(true);
    expect(getCatalogItem("tea-set-berry")?.assetId).toBe("tea-set");
  });

  it("offers a cosmetic fairy-light set that can be installed without changing gameplay", () => {
    const item = getCatalogItem("fairy-lights-neon");

    expect(canEquipItem("fairy-lights-neon", { type: "room", slot: "wall" })).toBe(true);
    expect(item).toMatchObject({ behavior: "room-layer", entitlement: "space", starsPrice: 90 });
    expect(item?.description).toMatch(/визуальн/i);
  });
});
