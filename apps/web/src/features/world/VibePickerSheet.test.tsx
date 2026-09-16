// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { DailyQuestCard } from "./DailyQuestCard";
import { VibePickerSheet } from "./VibePickerSheet";

describe("Cozy World controls", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.getState().reset();
    useUiStore.setState({ sheet: "vibes" as never });
  });

  it("selects the rainy date vibe", async () => {
    render(<VibePickerSheet />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Дождливое свидание/i }));

    expect(useAppStore.getState().world.cozy.vibe).toBe("rainy-date");
  });

  it("does not claim a quest twice", async () => {
    render(<DailyQuestCard />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Забрать/i }));

    expect(screen.getByText(/Уже в твоей коллекции/i)).toBeInTheDocument();
    expect(useAppStore.getState().claimDailyQuest()).toBe(false);
  });
});
