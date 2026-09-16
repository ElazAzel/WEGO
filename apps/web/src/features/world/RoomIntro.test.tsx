// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoomIntro } from "./RoomIntro";

describe("RoomIntro", () => {
  it("starts the move-in story from the showcase room", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();

    render(<RoomIntro onStart={onStart} />);

    expect(screen.getByText("Комната, которую можно собрать вместе")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /переезжает к нам/i }));

    expect(onStart).toHaveBeenCalledOnce();
  });
});
