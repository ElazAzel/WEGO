// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NotificationsPage } from "./NotificationsPage";

describe("NotificationsPage", () => {
  it("marks a notification as read when it is opened", () => {
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole("button", { name: /Скоро ваша годовщина/ }));

    expect(screen.getByRole("button", { name: /Скоро ваша годовщина/ })).toHaveClass("is-read");
  });
});
