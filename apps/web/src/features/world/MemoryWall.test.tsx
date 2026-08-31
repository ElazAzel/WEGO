// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "../../store/use-app-store";
import { MemoryWall } from "./MemoryWall";

describe("MemoryWall", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAppStore.getState().reset();
    useAppStore.getState().performRitual("tea");
  });

  it("pins the newest ritual moment", async () => {
    const memoryId = useAppStore.getState().world.memories[0]!.id;
    render(<MemoryWall compact={false} />);

    await userEvent.setup().click(screen.getByRole("button", { name: /Закрепить.*Вечерний чай/i }));

    expect(useAppStore.getState().world.cozy.memoryWall).toContain(memoryId);
    expect(screen.getByText("Закреплено в комнате")).toBeInTheDocument();
  });
});
