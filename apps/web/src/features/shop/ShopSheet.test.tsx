// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../../test-setup";
import { ShopSheet } from "./ShopSheet";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

describe("ShopSheet collection", () => {
  beforeEach(() => { window.localStorage.clear(); useAppStore.getState().reset(); useUiStore.getState().openSheet("shop"); });
  afterEach(() => { cleanup(); useUiStore.getState().closeSheet(); });

  it("offers installation instead of another purchase for an owned room item", () => {
    useAppStore.getState().unlockWithSparks("rainy-window", 1);
    render(<ShopSheet />);

    expect(screen.getByText("Окно с дождём")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Надеть" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "✦ 320" })).not.toBeInTheDocument();
  });
});
