import { create } from "zustand";

type Sheet = "checkin" | "guess" | "wardrobe" | "shop" | "plans" | "games" | "vibes" | "rituals" | "memories" | null;
interface UiState { tab: "wego" | "we" | "together" | "story" | "calendar" | "tasks" | "plans" | "more"; sheet: Sheet; revealOpen: boolean; shareStoryId: string | null; openSheet: (sheet: Exclude<Sheet, null>) => void; closeSheet: () => void; openReveal: () => void; closeReveal: () => void; openShare: (id: string) => void; closeShare: () => void; setTab: (tab: UiState["tab"]) => void; }

export const useUiStore = create<UiState>((set) => ({ tab: "wego", sheet: null, revealOpen: false, shareStoryId: null, openSheet: (sheet) => set({ sheet }), closeSheet: () => set({ sheet: null }), openReveal: () => set({ revealOpen: true }), closeReveal: () => set({ revealOpen: false }), openShare: (shareStoryId) => set({ shareStoryId }), closeShare: () => set({ shareStoryId: null }), setTab: (tab) => set({ tab }), }));
