import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateSpaceName, type SpaceType, type WegoStyle } from "@wego/domain";
import { WButton, WCard, WChip, WAvatar } from "@wego/ui";
import { getTelegramContext, haptic, openTelegramShare } from "../../lib/telegram";
import { apiFetch, authenticateTelegram, isApiEnabled } from "../../lib/api-client";
import { wegoAsset } from "../../lib/asset";
import { useAppStore, type AppSpace, type AppUser } from "../../store/use-app-store";

const names = ["Our Wego", "Малыш", "Пу", "Момо", "Тэко"];
const typeOptions: Array<{ id: SpaceType; label: string; description: string; tone: "coral" | "yellow" | "mint" }> = [
  { id: "pair", label: "Пара", description: "Для двоих влюблённых", tone: "coral" },
  { id: "friends", label: "Друзья", description: "Для лучших друзей", tone: "yellow" },
  { id: "family", label: "Семья", description: "Для близких людей", tone: "mint" },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const setOnboarding = useAppStore((state) => state.setOnboarding);
  const [step, setStep] = useState(0);
  const [type, setType] = useState<SpaceType>("pair");
  const [name, setName] = useState("Our Wego");
  const [style, setStyle] = useState<WegoStyle>("a");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [remoteSpace, setRemoteSpace] = useState<AppSpace | null>(null);
  const [remoteInviteUrl, setRemoteInviteUrl] = useState<string | null>(null);
  const [remoteUser, setRemoteUser] = useState<AppUser | null>(null);
  const [remoteBusy, setRemoteBusy] = useState(false);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const nameIsValid = validateSpaceName(name).success;
  const inviteUrl = useMemo(() => remoteInviteUrl ?? `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "wego_app_bot"}/app?startapp=join_${spaceId || "local-preview"}`, [remoteInviteUrl, spaceId]);

  async function next() {
    haptic();
    if (step === 2 && nameIsValid && isApiEnabled() && !remoteSpace) {
      setRemoteBusy(true); setRemoteError(null);
      try {
        const user = await authenticateTelegram();
        const created = await apiFetch<{ space: AppSpace }>("/spaces", { method: "POST", body: JSON.stringify({ name: name.trim(), type, style, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" }) });
        const invitation = await apiFetch<{ url: string }>(`/spaces/${created.space.id}/invitations`, { method: "POST" });
        setRemoteUser({ id: user.id, name: user.name, tone: user.tone });
        setRemoteSpace(created.space);
        setRemoteInviteUrl(invitation.url);
        setSpaceId(created.space.id);
      } catch { setRemoteError("Не удалось создать пространство. Попробуйте ещё раз."); return; }
      finally { setRemoteBusy(false); }
    } else if (step === 2 && nameIsValid && !spaceId) {
      setSpaceId(globalThis.crypto?.randomUUID?.() ?? `space-${Date.now()}`);
    }
    setStep((current) => Math.min(4, current + 1));
  }

  function finish() {
    if (isApiEnabled() && !remoteSpace) { setRemoteError("Пространство ещё не создано. Вернитесь на шаг назад и повторите."); return; }
    const id = spaceId ?? `space-${Date.now()}`;
    const localSpace = remoteSpace ?? { id, name: name.trim(), type, stage: "egg" as const, character: "Cozy Dreamer", daysAlive: 1, style, room: style === "a" ? "warm" as const : "morning" as const, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
    const telegramName = getTelegramContext().user?.first_name ?? "Вы";
    setOnboarding(localSpace, remoteUser ?? { id: "local-user", name: telegramName, tone: "coral" });
    navigate("/wego");
  }

  return <div className="onboarding"><div className="onboarding__progress" aria-label={`Шаг ${step + 1} из 5`}>{[0, 1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? "is-active" : ""} />)}</div>{remoteError && <p className="onboarding-error" role="alert">{remoteError}</p>}{step === 0 && <Splash onNext={next} />}{step === 1 && <TypeStep value={type} onChange={setType} onNext={next} />}{step === 2 && <NameStep value={name} onChange={setName} valid={nameIsValid} onNext={next} busy={remoteBusy} />}{step === 3 && <InviteStep url={inviteUrl} copied={copied} onCopy={async () => { try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); } catch { setCopied(false); } }} onShare={() => openTelegramShare(inviteUrl, `Присоединяйся к нашему Wego: ${inviteUrl}`)} onNext={next} />}{step === 4 && <RevealStep style={style} onStyleChange={setStyle} onFinish={finish} />}</div>;
}

function Splash({ onNext }: { onNext: () => void }) { return <div className="onboarding__step onboarding__step--splash"><div><div className="w-mono-caps">WEGO</div><h1 className="w-serif">Тамагочи<br /><em>вашей общей</em><br />жизни.</h1><p>Создайте маленький мир с человеком, который вам дорог.</p></div><WButton size="xl" onClick={onNext}>Создать Wego <span>→</span></WButton></div>; }

function TypeStep({ value, onChange, onNext }: { value: SpaceType; onChange: (value: SpaceType) => void; onNext: () => void }) { return <div className="onboarding__step"><div className="onboarding__copy"><div className="w-mono-caps">Шаг 1 из 4</div><h2 className="w-serif">Для кого создаём<br />пространство?</h2><div className="stack">{typeOptions.map((option) => <button type="button" key={option.id} className={`type-option ${value === option.id ? "is-selected" : ""}`} onClick={() => onChange(option.id)}><div><div className="w-serif">{option.label}</div><small>{option.description}</small></div><span aria-hidden="true">{value === option.id ? "✓" : ""}</span></button>)}</div></div><WButton size="xl" onClick={onNext}>Дальше →</WButton></div>; }

function NameStep({ value, onChange, valid, onNext, busy }: { value: string; onChange: (value: string) => void; valid: boolean; onNext: () => void; busy: boolean }) { return <div className="onboarding__step"><div className="onboarding__copy"><div className="w-mono-caps">Шаг 2 из 4</div><h2 className="w-serif">Как назовём<br />вашего Wego?</h2><label className="sr-only" htmlFor="wego-name">Имя Wego</label><input id="wego-name" value={value} maxLength={24} onChange={(event) => onChange(event.target.value)} aria-invalid={!valid} /><div className="chip-wrap">{names.map((item) => <WChip key={item} active={item === value} onClick={() => onChange(item)}>{item}</WChip>)}</div></div><WButton size="xl" loading={busy} disabled={!valid} onClick={onNext}>Дальше →</WButton></div>; }

function InviteStep({ url, copied, onCopy, onShare, onNext }: { url: string; copied: boolean; onCopy: () => void; onShare: () => void; onNext: () => void }) { return <div className="onboarding__step"><div className="onboarding__copy"><div className="w-mono-caps">Шаг 3 из 4</div><h2 className="w-serif">Пригласите<br />второго участника</h2><p>Отправьте ссылку — второй участник откроет её в Telegram и автоматически попадёт в вашу общую комнату.</p><WCard tone="lilac" className="invite-card"><code>{url}</code><div className="invite-card__actions"><button type="button" onClick={onShare}>Отправить в Telegram</button><button type="button" onClick={onCopy}>{copied ? "Скопировано" : "Копировать"}</button></div></WCard></div><WButton size="xl" onClick={onNext}>Продолжить →</WButton></div>; }

function RevealStep({ style, onStyleChange, onFinish }: { style: WegoStyle; onStyleChange: (style: WegoStyle) => void; onFinish: () => void }) { return <div className="onboarding__step onboarding__step--reveal"><div className="onboarding__copy"><div className="style-switch"><button type="button" className={style === "a" ? "is-active" : ""} onClick={() => onStyleChange("a")}>Style A</button><button type="button" className={style === "b" ? "is-active" : ""} onClick={() => onStyleChange("b")}>Style B</button></div><img src={wegoAsset(style, "egg")} alt="Ваш Wego" className="wego-onboarding-art" /><h2 className="w-serif">Ваш Wego <em>появился</em></h2><p>Он будет расти вместе с тем, что вы делаете и говорите друг другу.</p></div><WButton size="xl" onClick={onFinish}>Начать →</WButton></div>; }
