// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { NeedMeter, SparkBalance, UnlockBadge } from "./index";

describe("WEGO game design primitives", () => {
  it("exposes a labeled spark balance and accessible need meter", () => {
    render(<><SparkBalance balance={42} /><NeedMeter label="Радость" value={72} /></>);
    expect(screen.getByLabelText("42 Искр")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Радость" })).toHaveAttribute("aria-valuenow", "72");
  });

  it("communicates locked and unlocked item state", () => {
    render(<><UnlockBadge unlocked={false}>✦ 40</UnlockBadge><UnlockBadge unlocked>Открыто</UnlockBadge></>);
    expect(screen.getByText("✦ 40")).toHaveAttribute("data-state", "locked");
    expect(screen.getByText("Открыто")).toHaveAttribute("data-state", "unlocked");
  });
});
