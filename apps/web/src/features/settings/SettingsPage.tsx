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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!space) return null;
  const activeSpace = space;

  async function invitePartner() {
    setBusy(true); setError(null); setCopied(false);
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

  async function copyInvite() {
    if (!inviteUrl) return;
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); } catch { setError("Не удалось скопировать ссылку. Откройте приглашение через Telegram."); }
  }

  async function logout() {
    setBusy(true);
    try { if (isApiEnabled()) await logoutTelegram(); reset(); navigate("/onboarding", { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось выйти из аккаунта."); }
    finally { setBusy(false); }
  }

  return <div className="app-page life-page"><PageHeader eyebrow="Аккаунт" title="Ваш Wego" backTo="/wego" description="Управляйте комнатой, приглашением и настройками отображения." /><div className="settings-list">
    <WCard tone="lilac" className="settings-account-card"><div className="settings-card-heading"><div><div className="w-mono-caps">Ваш аккаунт</div><div className="settings-account__name">{me?.name ?? "Telegram-пользователь"}</div></div><span className="settings-status-dot" aria-hidden="true" /></div><p className="settings-helper">{isApiEnabled() ? "Telegram подключён. Данные комнаты синхронизируются с партнёром." : "Локальный предпросмотр: данные хранятся только на этом устройстве."}</p><div className="settings-partner"><span className="w-mono-caps">Партнёр</span><strong>{partner?.name ?? "Ещё не подключён"}</strong><small>{partner ? "Общая комната активна — вы оба видите одного Wego и его историю." : "Создайте ссылку и отправьте её партнёру. После входа через Telegram он появится здесь."}</small></div>{!partner && <WButton size="md" loading={busy} onClick={() => void invitePartner()}>Пригласить партнёра <span aria-hidden="true">↗</span></WButton>}{inviteUrl && <div className="invite-result" role="status"><code>{inviteUrl}</code><button type="button" onClick={() => void copyInvite()}>{copied ? "Скопировано" : "Копировать"}</button></div>}{error && <p className="onboarding-error" role="alert">{error}</p>}</WCard>
    <WCard tone="paper" className="settings-guide"><div className="w-mono-caps">Как подключить партнёра</div><ol><li>Нажмите «Пригласить партнёра».</li><li>Отправьте ссылку в Telegram.</li><li>Партнёр откроет её и войдёт в эту комнату.</li></ol></WCard>
    {import.meta.env.DEV && <><WCard tone="paper"><div className="w-mono-caps">Визуальный стиль</div><div className="chip-wrap settings-options"><WChip active={activeSpace.style === "a"} onClick={() => setStyle("a")}>Style A · Premium</WChip><WChip active={activeSpace.style === "b"} onClick={() => setStyle("b")}>Style B · Cozy</WChip></div></WCard><WCard tone="paper"><div className="w-mono-caps">Главный экран</div><div className="chip-wrap settings-options"><WChip active={homeVariant === "v1"} onClick={() => setHomeVariant("v1")}>Room-first</WChip><WChip active={homeVariant === "v2"} onClick={() => setHomeVariant("v2")}>Character-first</WChip></div></WCard><WCard tone="paper"><div className="w-mono-caps">Reveal</div><div className="chip-wrap settings-options"><WChip active={revealVariant === "v1"} onClick={() => setRevealVariant("v1")}>Parallel cards</WChip><WChip active={revealVariant === "v2"} onClick={() => setRevealVariant("v2")}>Envelope</WChip></div></WCard></>}
    <WButton variant="ghost" size="md" loading={busy} onClick={() => void logout()}>Выйти из аккаунта</WButton>
  </div></div>;
}
