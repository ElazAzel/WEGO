// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { PairGameSheet } from "./PairGameSheet";

describe("choose-vibe pair game", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.getState().reset();
    useUiStore.setState({ sheet: "games" });
  });

  it("waits for a partner after the first vibe choice", async () => {
    render(<PairGameSheet />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Ночная ламповая" }));

    expect(screen.getByText(/Ждём выбор партнёра/i)).toBeInTheDocument();
    expect(useAppStore.getState().world.cozy.game).toMatchObject({ status: "waiting", myAnswer: "night-cozy" });
  });
});
