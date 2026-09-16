// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../../test-setup";
import { WardrobeSheet } from "./WardrobeSheet";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

describe("WardrobeSheet equipment", () => {
  beforeEach(() => { window.localStorage.clear(); useAppStore.getState().reset(); useUiStore.getState().openSheet("wardrobe"); });
  afterEach(() => { cleanup(); useUiStore.getState().closeSheet(); });

  it("shows the equipped outfit as worn", () => {
    useAppStore.getState().unlockWithSparks("sunny-scarf", 1);
    useAppStore.getState().equipWegoItem("sunny-scarf");
    render(<WardrobeSheet />);

    expect(screen.getByText("Надето")).toBeInTheDocument();
    expect(screen.getByText("Солнечный шарфик")).toBeInTheDocument();
  });
});
