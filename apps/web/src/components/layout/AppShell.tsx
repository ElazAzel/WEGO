import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { WTabBar, type TabId } from "@wego/ui";
import { CheckinSheet, GuessSheet } from "../../features/checkin/CheckinSheet";
import { RevealOverlay } from "../../features/reveal/RevealOverlay";
import { ShareCardDialog } from "../../features/share/ShareCardDialog";
import { useUiStore } from "../../store/use-ui-store";
import { useAppStore } from "../../store/use-app-store";
import { WardrobeSheet } from "../../features/customization/WardrobeSheet";
import { ShopSheet } from "../../features/shop/ShopSheet";
import { PlanBoard } from "../../features/shared/PlanBoard";
import { PairGameSheet } from "../../features/minigames/PairGameSheet";
import { VibePickerSheet } from "../../features/world/VibePickerSheet";
import { RitualSheet } from "../../features/world/RitualSheet";
import { MemoryWallSheet } from "../../features/world/MemoryWall";

const paths: Record<TabId, string> = { wego: "/wego", calendar: "/calendar", tasks: "/tasks", plans: "/plans", story: "/more", we: "/we", together: "/together" };

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const ui = useUiStore();
  const rolloverIfNeeded = useAppStore((state) => state.rolloverIfNeeded);
  useEffect(() => { rolloverIfNeeded(); const timer = window.setInterval(rolloverIfNeeded, 60_000); window.addEventListener("focus", rolloverIfNeeded); return () => { window.clearInterval(timer); window.removeEventListener("focus", rolloverIfNeeded); }; }, [rolloverIfNeeded]);
  const current = (["/more", "/notes", "/cards", "/history", "/pet", "/notifications"].some(path => location.pathname.startsWith(path)) ? "story" : Object.entries(paths).find(([, path]) => location.pathname.startsWith(path))?.[0] ?? "wego") as TabId;
  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [location.pathname]);
  return (
    <div className="app-shell">
      <main className="app-shell__content" id="main-content"><Outlet /></main>
      <WTabBar current={current} onChange={(tab) => { ui.setTab(tab); navigate(paths[tab]); }} />
      <CheckinSheet />
      <GuessSheet />
      {ui.revealOpen && <RevealOverlay />}
      {ui.shareStoryId && <ShareCardDialog storyId={ui.shareStoryId} />}
      <WardrobeSheet />
      <ShopSheet />
      <PlanBoard />
      <PairGameSheet />
      <VibePickerSheet />
      <RitualSheet />
      <MemoryWallSheet />
    </div>
  );
}
