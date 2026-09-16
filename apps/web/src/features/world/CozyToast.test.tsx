// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CozyToast } from "./CozyToast";

describe("CozyToast", () => {
  it("announces the result of a ritual without blocking the room", () => {
    render(<CozyToast feedback={{ message: "Чай готов", reward: 4 }} onDismiss={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Чай готов");
    expect(screen.getByRole("status")).toHaveTextContent("+4 Искр");
  });
});
