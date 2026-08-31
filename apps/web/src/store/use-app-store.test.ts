// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "./use-app-store";

describe("app world equipment actions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.getState().reset();
  });

  it("persists a lamp interaction in the store", () => {
    const result = useAppStore.getState().interactRoom({ objectId: "lamp", interaction: "toggle" });

    expect(result.message).toContain("свет");
    expect(useAppStore.getState().world.environment.lamp).toBe("off");
  });

  it("adds an owned room item before it can be equipped", () => {
    const bought = useAppStore.getState().unlockWithSparks("rainy-window", 1);

    expect(bought).toBe(true);
    expect(useAppStore.getState().world.unlockedItemIds).toContain("rainy-window");
    expect(useAppStore.getState().equipRoomItem("rainy-window")).toBe(true);
    expect(useAppStore.getState().world.equippedRoomItems.wall).toBe("rainy-window");
  });

  it("equips an owned outfit without charging again", () => {
    expect(useAppStore.getState().unlockWithSparks("sunny-scarf", 1)).toBe(true);
    expect(useAppStore.getState().equipWegoItem("sunny-scarf")).toBe(true);
    expect(useAppStore.getState().world.equippedWegoItems.outfit).toBe("sunny-scarf");
    expect(useAppStore.getState().economy.wallet.balance).toBe(119);
  });

  it("keeps a chosen cozy vibe in the persisted world state", () => {
    useAppStore.getState().setRoomVibe("rainy-date");

    expect(useAppStore.getState().world.cozy.vibe).toBe("rainy-date");
    expect(useAppStore.getState().world.cozy.pose).toBe("curious");
  });

  it("claims the daily capsule once", () => {
    expect(useAppStore.getState().claimDailyQuest()).toBe(true);
    expect(useAppStore.getState().world.cozy.dailyQuest.status).toBe("claimed");
    expect(useAppStore.getState().claimDailyQuest()).toBe(false);
  });

  it("waits for a partner after choosing a shared vibe", () => {
    useAppStore.getState().answerChooseVibe("night-cozy");

    expect(useAppStore.getState().world.cozy.game).toMatchObject({ status: "waiting", myAnswer: "night-cozy" });
  });

  it("surfaces a ritual moment in the shared Story", () => {
    useAppStore.getState().performRitual("tea");

    expect(useAppStore.getState().story[0]).toMatchObject({ title: "Вечерний чай", type: "activity" });
  });

  it("starts the move-in journey from the furnished showcase", () => {
    expect(useAppStore.getState().world.cozy.roomPhase).toBe("showcase");
    const result = useAppStore.getState().startMoveIn();

    expect(result.message).toContain("переезжаю");
    expect(useAppStore.getState().world.cozy).toMatchObject({ roomPhase: "move-in", moveInStep: "meet-wego", roomBuildLevel: 0 });
  });

  it("completes the first guided room corner", () => {
    const state = useAppStore.getState();
    state.startMoveIn();
    state.performWorldAction("pet", "toy");
    state.performRitual("tea");

    expect(state.placeFirstFurniture()).toBeTruthy();
    expect(useAppStore.getState().world.cozy).toMatchObject({ roomPhase: "settled", moveInStep: "complete", roomBuildLevel: 1 });
    expect(useAppStore.getState().story[0]?.title).toBe("Первый угол");
  });
});
