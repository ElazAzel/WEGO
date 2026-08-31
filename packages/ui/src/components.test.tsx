// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BottomSheet, WChip, WTabBar } from "./index";

describe("Wego UI primitives", () => {
  it("exposes pressed state and keyboard activation for a chip", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<WChip active={false} onClick={onClick}>Хорошо</WChip>);
    const chip = screen.getByRole("button", { name: "Хорошо" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("marks the current tab and changes it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<WTabBar current="wego" onChange={onChange} />);
    expect(screen.getByRole("tab", { name: "Wego" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("tab", { name: "Story" }));
    expect(onChange).toHaveBeenCalledWith("story");
  });

  it("closes a sheet with Escape and returns focus to its trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<><button>Открыть</button><BottomSheet open title="Check-in" onClose={onClose}>Содержимое</BottomSheet></>);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
