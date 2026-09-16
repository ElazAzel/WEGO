// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { MorePage } from "./MorePage";

describe("MorePage modules", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
    useAppStore.getState().setOnboarding({ id: "space-1", name: "Мой Wego", type: "pair", stage: "egg", character: "Cozy Dreamer", daysAlive: 1, style: "a", room: "warm", timezone: "Asia/Almaty" }, { id: "local-preview", name: "Я", tone: "coral" });
  });

  it("opens the notes module from its card", () => {
    render(
      <MemoryRouter initialEntries={["/more"]}>
        <Routes>
          <Route path="/more" element={<MorePage />} />
          <Route path="/notes" element={<div>Экран заметок</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Заметки и файлы/ }));

    expect(screen.getByText("Экран заметок")).toBeInTheDocument();
  });
});
