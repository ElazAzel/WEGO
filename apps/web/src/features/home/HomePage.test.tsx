// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { HomePage } from "./HomePage";

vi.mock("../world/LivingRoomScene", () => ({ LivingRoomScene: () => <div>Комната Wego</div> }));
vi.mock("../world/GameHud", () => ({ GameHud: () => <div>Состояние Wego</div> }));
vi.mock("../life/life-api", () => ({ useLifeRecords: () => ({ records: [] }) }));

describe("HomePage account entry", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.getState().setOnboarding(
      { id: "space-1", name: "Мой Wego", type: "pair", stage: "egg", character: "Cozy Dreamer", daysAlive: 1, style: "a", room: "warm", timezone: "Asia/Almaty" },
      { id: "user-1", name: "Алекс", tone: "coral" },
    );
  });

  it("opens the Telegram account screen from the home header", () => {
    render(
      <MemoryRouter initialEntries={["/wego"]}>
        <Routes>
          <Route path="/wego" element={<HomePage />} />
          <Route path="/settings" element={<div>Аккаунт WEGO</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Открыть аккаунт" }));

    expect(screen.getByText("Аккаунт WEGO")).toBeInTheDocument();
  });
});
