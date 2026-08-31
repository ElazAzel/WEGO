// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { LivingRoomScene } from "./LivingRoomScene";

function settleRoom() {
  const state = useAppStore.getState();
  state.startMoveIn();
  state.performWorldAction("pet", "toy");
  state.performRitual("tea");
  state.placeFirstFurniture();
}

const props = { room: "warm" as const, style: "a" as const, stage: "adult" as const, daysAlive: 2, character: "Cozy Dreamer" };

describe("LivingRoomScene equipment", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.getState().reset();
  });

  it("shows an installed room item after purchase and equip", () => {
    settleRoom();
    expect(useAppStore.getState().unlockWithSparks("tea-set-berry", 80)).toBe(true);
    expect(useAppStore.getState().equipRoomItem("tea-set-berry")).toBe(true);

    render(<LivingRoomScene {...props} />);

    expect(screen.getByRole("button", { name: "Налить чай для двоих" })).toBeInTheDocument();
  });

  it("keeps the selected Wego outfit visible in the scene", () => {
    settleRoom();
    expect(useAppStore.getState().unlockWithSparks("sunny-scarf", 90)).toBe(true);
    expect(useAppStore.getState().equipWegoItem("sunny-scarf")).toBe(true);

    const { container } = render(<LivingRoomScene {...props} />);

    expect(container.querySelector(".living-room-scene__wego--sunny-scarf")).toBeInTheDocument();
  });

  it("shows an equipped cozy prop from the shop", () => {
    settleRoom();
    expect(useAppStore.getState().unlockWithSparks("candle-night", 70)).toBe(true);
    expect(useAppStore.getState().equipRoomItem("candle-night")).toBe(true);

    const { container } = render(<LivingRoomScene {...props} />);

    expect(container.querySelector('[data-object-id="candle"]')).toBeInTheDocument();
  });
});
