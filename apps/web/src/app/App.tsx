import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { StoryEntry, WorldSnapshot } from "@wego/domain";
import { AppShell } from "../components/layout/AppShell";
import { HomePage } from "../features/home/HomePage";
import { OnboardingPage } from "../features/onboarding/OnboardingPage";
import { StoryPage } from "../features/story/StoryPage";
import { TogetherPage } from "../features/together/TogetherPage";
import { WePage } from "../features/we/WePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { CalendarPage } from "../features/life/CalendarPage";
import { TasksPage } from "../features/life/TasksPage";
import { PlansPage } from "../features/life/PlansPage";
import { MorePage } from "../features/life/MorePage";
import { NotesPage } from "../features/life/NotesPage";
import { LoyaltyCardsPage } from "../features/life/LoyaltyCardsPage";
import { HistoryPage } from "../features/life/HistoryPage";
import { PetPage } from "../features/life/PetPage";
import { NotificationsPage } from "../features/life/NotificationsPage";
import { useAppStore, type AppToday } from "../store/use-app-store";
import { acceptInvite, apiFetch, authenticateTelegram, isApiEnabled } from "../lib/api-client";
import { useSpaceEvents } from "../hooks/useSpaceEvents";
import { registerWegoServiceWorker } from "../lib/pwa";
import { getJoinToken, isTelegram } from "../lib/telegram";

export function App() {
  useEffect(() => { void registerWegoServiceWorker(); }, []);
  const remoteMode = isApiEnabled();
  const [remoteStatus, setRemoteStatus] = useState<"idle" | "loading" | "ready" | "error">(remoteMode ? "loading" : "ready");
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const hasSpace = Boolean(useAppStore((state) => state.space));
  const spaceId = useAppStore((state) => state.space?.id ?? null);
  const hydrate = useAppStore((state) => state.hydrate);
  const refreshSharedState = useCallback(() => {
    if (!isApiEnabled()) return;
    const currentSpace = useAppStore.getState().space;
    if (!currentSpace) return;
    void Promise.all([
      apiFetch<BootstrapResponse>("/bootstrap"),
      apiFetch<RemoteToday>(`/spaces/${currentSpace.id}/today`),
      apiFetch<{ entries: StoryEntry[] }>(`/spaces/${currentSpace.id}/story`),
    ]).then(([bootstrap, today, story]) => hydrate({ space: bootstrap.activeSpace, partner: bootstrap.partner, today: mapToday(today), story: story.entries, world: bootstrap.world, worldRevision: bootstrap.worldRevision })).catch(() => undefined);
  }, [hydrate]);
  useSpaceEvents(spaceId, refreshSharedState);
  useEffect(() => {
    if (!remoteMode) return;
    let mounted = true;
    void (async () => {
      try {
        if (!isTelegram()) throw new Error("Откройте WEGO из Telegram, чтобы войти в аккаунт.");
        const user = await authenticateTelegram();
        let bootstrap = await apiFetch<BootstrapResponse>("/bootstrap");
        const joinToken = getJoinToken();
        if (!bootstrap.activeSpace && joinToken) {
          await acceptInvite(joinToken);
          bootstrap = await apiFetch<BootstrapResponse>("/bootstrap");
        }
        if (!mounted) return;
        if (!bootstrap.activeSpace) { hydrate({ space: null, me: user, partner: null, world: bootstrap.world, worldRevision: bootstrap.worldRevision }); setRemoteStatus("ready"); return; }
        const [today, story] = await Promise.all([
          apiFetch<RemoteToday>(`/spaces/${bootstrap.activeSpace.id}/today`),
          apiFetch<{ entries: StoryEntry[] }>(`/spaces/${bootstrap.activeSpace.id}/story`),
        ]);
        if (!mounted) return;
        hydrate({ space: bootstrap.activeSpace, me: user, partner: bootstrap.partner, today: mapToday(today), story: story.entries, world: bootstrap.world, worldRevision: bootstrap.worldRevision });
        setRemoteStatus("ready");
      } catch (error) {
        if (!mounted) return;
        setRemoteError(error instanceof Error ? error.message : "Не удалось подключиться к WEGO.");
        setRemoteStatus("error");
      }
    })();
    return () => { mounted = false; };
  }, [hydrate, remoteMode]);
  if (remoteMode && remoteStatus !== "ready") return <RemoteGate status={remoteStatus} error={remoteError} onRetry={() => window.location.reload()} />;
  return (
    <Routes>
      <Route path="/onboarding/*" element={hasSpace ? <Navigate to="/wego" replace /> : <OnboardingPage />} />
      <Route element={<GuardedShell hasSpace={hasSpace} />}>
        <Route path="/wego" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/cards" element={<LoyaltyCardsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/pet" element={<PetPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
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

function RemoteGate({ status, error, onRetry }: { status: "idle" | "loading" | "error"; error: string | null; onRetry: () => void }) {
  return <div className="remote-gate"><div className="w-mono-caps">WEGO / TELEGRAM</div><h1 className="w-serif">{status === "error" ? "Не удалось войти" : "Открываем ваш мир"}</h1><p>{error ?? "Подтверждаем Telegram-аккаунт и загружаем общую комнату."}</p>{status === "error" && <button type="button" onClick={onRetry}>Повторить</button>}</div>;
}

type ApiUser = { id: string; name: string; tone: "coral" | "lilac" };
type BootstrapResponse = { user: ApiUser; activeSpace: NonNullable<ReturnType<typeof useAppStore.getState>["space"]> | null; partner: ApiUser | null; world: WorldSnapshot; worldRevision: number };
type RemoteToday = { date: string; me: { mood: AppToday["myMood"]; energy: AppToday["myEnergy"]; want: AppToday["myWant"]; note: string | null; guess: AppToday["myGuess"]; revealed: boolean } | null; partner: { mood: AppToday["partnerMood"]; energy: AppToday["partnerEnergy"]; want: AppToday["partnerWant"]; note?: string | null } | null };

function mapToday(remote: RemoteToday): AppToday {
  const current = useAppStore.getState().today;
  return { ...current, date: remote.date, myMood: remote.me?.mood ?? null, myEnergy: remote.me?.energy ?? null, myWant: remote.me?.want ?? null, myNote: remote.me?.note ?? "", myGuess: remote.me?.guess ?? null, partnerMood: remote.partner?.mood ?? null, partnerEnergy: remote.partner?.energy ?? null, partnerWant: remote.partner?.want ?? null, partnerNote: remote.partner?.note ?? null, revealed: remote.me?.revealed ?? false };
}

function GuardedShell({ hasSpace }: { hasSpace: boolean }) { return hasSpace ? <AppShell /> : <Navigate to="/onboarding" replace />; }
