// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MoveInGuide } from "./MoveInGuide";

describe("MoveInGuide", () => {
  it("asks the player to meet Wego first", () => {
    render(<MoveInGuide step="meet-wego" onOpenRituals={vi.fn()} onPlaceFurniture={vi.fn()} />);

    expect(screen.getByText("Познакомь Вего с комнатой")).toBeInTheDocument();
    expect(screen.getByText(/нажми на вего/i)).toBeInTheDocument();
  });

  it("opens the first ritual and then places the first rug", async () => {
    const user = userEvent.setup();
    const onOpenRituals = vi.fn();
    const onPlaceFurniture = vi.fn();

    const { rerender } = render(<MoveInGuide step="first-ritual" onOpenRituals={onOpenRituals} onPlaceFurniture={onPlaceFurniture} />);
    await user.click(screen.getByRole("button", { name: /выбрать ритуал/i }));
    expect(onOpenRituals).toHaveBeenCalledOnce();

    rerender(<MoveInGuide step="first-furniture" onOpenRituals={onOpenRituals} onPlaceFurniture={onPlaceFurniture} />);
    await user.click(screen.getByRole("button", { name: /поставить коврик/i }));
    expect(onPlaceFurniture).toHaveBeenCalledOnce();
  });
});
