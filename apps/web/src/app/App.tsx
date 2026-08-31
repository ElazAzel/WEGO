import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { StoryEntry, WorldSnapshot } from "@wego/domain";
import { AppShell } from "../components/layout/AppShell";
import { HomePage } from "../features/home/HomePage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { StoryPage } from "../features/story/StoryPage";
import { TogetherPage } from "../features/together/TogetherPage";
import { WePage } from "../features/we/WePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { useAppStore, type AppToday } from "../store/use-app-store";
import { apiFetch, authenticateTelegram, isApiEnabled } from "../lib/api-client";

export function App() {
  const hasSpace = Boolean(useAppStore((state) => state.space));
  const hydrate = useAppStore((state) => state.hydrate);
  useEffect(() => {
    if (!isApiEnabled()) return;
    let mounted = true;
    void (async () => {
      try {
        const user = await authenticateTelegram();
        const bootstrap = await apiFetch<BootstrapResponse>("/bootstrap");
        if (!mounted) return;
        if (!bootstrap.activeSpace) { hydrate({ space: null, me: user, partner: null, world: bootstrap.world }); return; }
        const [today, story] = await Promise.all([
          apiFetch<RemoteToday>(`/spaces/${bootstrap.activeSpace.id}/today`),
          apiFetch<{ entries: StoryEntry[] }>(`/spaces/${bootstrap.activeSpace.id}/story`),
        ]);
        if (!mounted) return;
        hydrate({ space: bootstrap.activeSpace, me: user, partner: bootstrap.partner, today: mapToday(today), story: story.entries, world: bootstrap.world });
      } catch {
        // Local-first state remains available when API is temporarily unreachable.
      }
    })();
    return () => { mounted = false; };
  }, [hydrate]);
  return (
    <Routes>
      <Route path="/onboarding/*" element={<OnboardingPage />} />
      <Route element={<GuardedShell hasSpace={hasSpace} />}>
        <Route path="/wego" element={<HomePage />} />
        <Route path="/we" element={<WePage />} />
        <Route path="/together" element={<TogetherPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/" element={<Navigate to={hasSpace ? "/wego" : "/onboarding"} replace />} />
      <Route path="*" element={<Navigate to={hasSpace ? "/wego" : "/onboarding"} replace />} />
    </Routes>
  );
}

type ApiUser = { id: string; name: string; tone: "coral" | "lilac" };
type BootstrapResponse = { user: ApiUser; activeSpace: NonNullable<ReturnType<typeof useAppStore.getState>["space"]> | null; partner: ApiUser | null; world: WorldSnapshot };
type RemoteToday = { date: string; me: { mood: AppToday["myMood"]; energy: AppToday["myEnergy"]; want: AppToday["myWant"]; note: string | null; guess: AppToday["myGuess"]; revealed: boolean } | null; partner: { mood: AppToday["partnerMood"]; energy: AppToday["partnerEnergy"]; want: AppToday["partnerWant"]; note?: string | null } | null };

function mapToday(remote: RemoteToday): AppToday {
  const current = useAppStore.getState().today;
  return { ...current, date: remote.date, myMood: remote.me?.mood ?? null, myEnergy: remote.me?.energy ?? null, myWant: remote.me?.want ?? null, myNote: remote.me?.note ?? "", myGuess: remote.me?.guess ?? null, partnerMood: remote.partner?.mood ?? null, partnerEnergy: remote.partner?.energy ?? null, partnerWant: remote.partner?.want ?? null, partnerNote: remote.partner?.note ?? null, revealed: remote.me?.revealed ?? false };
}

function GuardedShell({ hasSpace }: { hasSpace: boolean }) { return hasSpace ? <AppShell /> : <Navigate to="/onboarding" replace />; }
