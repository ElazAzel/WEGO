// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SceneHotspot } from "./SceneHotspot";

describe("SceneHotspot", () => {
  it("announces the object label and invokes its action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SceneHotspot label="Включить гирлянду" onClick={onClick} active />);

    await user.click(screen.getByRole("button", { name: "Включить гирлянду" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not invoke a locked object", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<SceneHotspot label="Открыть подарок" onClick={onClick} locked />);

    await user.click(screen.getByRole("button", { name: "Открыть подарок" }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Открыть подарок" })).toHaveAttribute("aria-disabled", "true");
  });
});
