import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { WButton, WCard, WChip } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { useAppStore } from "../../store/use-app-store";
import { apiFetch, isApiEnabled, logoutTelegram } from "../../lib/api-client";
import { openTelegramShare } from "../../lib/telegram";

export function SettingsPage() {
  const navigate = useNavigate();
  const space = useAppStore((state) => state.space);
  const me = useAppStore((state) => state.me);
  const partner = useAppStore((state) => state.partner);
  const homeVariant = useAppStore((state) => state.homeVariant);
  const revealVariant = useAppStore((state) => state.revealVariant);
  const setStyle = useAppStore((state) => state.setStyle);
  const setHomeVariant = useAppStore((state) => state.setHomeVariant);
  const setRevealVariant = useAppStore((state) => state.setRevealVariant);
  const reset = useAppStore((state) => state.reset);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!space) return null;
  const activeSpace = space;

  async function invitePartner() {
    setBusy(true); setError(null);
    try {
      const url = isApiEnabled()
        ? (await apiFetch<{ url: string }>(`/spaces/${activeSpace.id}/invitations`, { method: "POST" })).url
        : `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "wego_app_bot"}/app?startapp=join_${activeSpace.id}`;
      setInviteUrl(url);
      openTelegramShare(url, `Присоединяйся к ${activeSpace.name} в WEGO`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать приглашение.");
    } finally { setBusy(false); }
  }

  async function logout() {
    if (isApiEnabled()) await logoutTelegram();
    reset();
    navigate("/onboarding", { replace: true });
  }

  return <div className="app-page"><PageHeader eyebrow="Настройки" title="Ваш Wego" description="Здесь видно, кто уже в вашей комнате и как пригласить второго участника." /><div className="settings-list">
    <WCard tone="lilac"><div className="w-mono-caps">Аккаунт</div><div className="settings-account"><strong>{me?.name ?? "Telegram-пользователь"}</strong><span>{isApiEnabled() ? "Синхронизация включена" : "Локальный предпросмотр"}</span></div><div className="settings-partner"><span className="w-mono-caps">Партнёр</span><strong>{partner?.name ?? "Ещё не подключён"}</strong>{partner ? <small>Вы оба видите одну комнату и общие действия.</small> : <small>Создайте приглашение — после входа через Telegram партнёр появится здесь.</small>}</div>{!partner && <WButton size="sm" loading={busy} onClick={() => void invitePartner()}>Пригласить партнёра</WButton>}{inviteUrl && <code className="settings-invite-url">{inviteUrl}</code>}{error && <p className="onboarding-error" role="alert">{error}</p>}<WButton size="sm" variant="secondary" onClick={() => void logout()}>Выйти из аккаунта</WButton></WCard>
    <WCard tone="paper"><div className="w-mono-caps">Визуальный стиль</div><div className="chip-wrap settings-options"><WChip active={activeSpace.style === "a"} onClick={() => setStyle("a")}>Style A · Premium</WChip><WChip active={activeSpace.style === "b"} onClick={() => setStyle("b")}>Style B · Cozy</WChip></div></WCard>
    <WCard tone="paper"><div className="w-mono-caps">Главный экран</div><div className="chip-wrap settings-options"><WChip active={homeVariant === "v1"} onClick={() => setHomeVariant("v1")}>Room-first</WChip><WChip active={homeVariant === "v2"} onClick={() => setHomeVariant("v2")}>Character-first</WChip></div></WCard>
    <WCard tone="paper"><div className="w-mono-caps">Reveal</div><div className="chip-wrap settings-options"><WChip active={revealVariant === "v1"} onClick={() => setRevealVariant("v1")}>Parallel cards</WChip><WChip active={revealVariant === "v2"} onClick={() => setRevealVariant("v2")}>Envelope</WChip></div></WCard>
  </div></div>;
}
