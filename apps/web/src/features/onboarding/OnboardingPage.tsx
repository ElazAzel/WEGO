import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateSpaceName, type SpaceType, type WegoStyle } from "@wego/domain";
import { WButton, WCard, WChip, WAvatar } from "@wego/ui";
import { getTelegramContext, haptic, openTelegramShare } from "../../lib/telegram";
import { apiFetch, authenticateTelegram, isApiEnabled } from "../../lib/api-client";
import { wegoAsset } from "../../lib/asset";
import { useAppStore, type AppSpace, type AppUser } from "../../store/use-app-store";

const TOTAL_STEPS = 5;
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
        setRemoteSpace(created.space); setRemoteInviteUrl(invitation.url); setSpaceId(created.space.id);
      } catch (cause) { setRemoteError(cause instanceof Error ? cause.message : "Не удалось создать пространство. Попробуйте ещё раз."); return; }
      finally { setRemoteBusy(false); }
    } else if (step === 2 && nameIsValid && !spaceId) setSpaceId(globalThis.crypto?.randomUUID?.() ?? `space-${Date.now()}`);
    setRemoteError(null); setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  }

  function back() { setRemoteError(null); setStep((current) => Math.max(0, current - 1)); }

  function finish() {
    if (isApiEnabled() && !remoteSpace) { setRemoteError("Пространство ещё не создано. Вернитесь на шаг назад и повторите."); return; }
    const id = spaceId ?? `space-${Date.now()}`;
    const localSpace = remoteSpace ?? { id, name: name.trim(), type, stage: "egg" as const, character: "Cozy Dreamer", daysAlive: 1, style, room: style === "a" ? "warm" as const : "morning" as const, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" };
    const telegramName = getTelegramContext().user?.first_name ?? "Вы";
    setOnboarding(localSpace, remoteUser ?? { id: "local-user", name: telegramName, tone: "coral" });
    navigate("/wego");
  }

  return <main className="onboarding"><div className="onboarding__top"><div className="onboarding__brand w-mono-caps">WEGO</div><div className="onboarding__progress" aria-label={`Шаг ${step + 1} из ${TOTAL_STEPS}`} role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL_STEPS} aria-valuenow={step + 1}>{Array.from({ length: TOTAL_STEPS }, (_, item) => <span key={item} className={item <= step ? "is-active" : ""} />)}</div></div>{remoteError && <p className="onboarding-error" role="alert">{remoteError}</p>}{step > 0 && <button type="button" className="onboarding__back" onClick={back}><span aria-hidden="true">←</span> Назад</button>}{step === 0 && <Splash onNext={next} />}{step === 1 && <TypeStep value={type} onChange={setType} onNext={next} />}{step === 2 && <NameStep value={name} onChange={setName} valid={nameIsValid} onNext={next} busy={remoteBusy} />}{step === 3 && <InviteStep url={inviteUrl} copied={copied} onCopy={async () => { try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); } catch { setCopied(false); } }} onShare={() => openTelegramShare(inviteUrl, `Присоединяйся к нашему Wego: ${inviteUrl}`)} onNext={next} />}{step === 4 && <RevealStep style={style} onStyleChange={setStyle} onFinish={finish} />}</main>;
}

function StepLabel({ step }: { step: number }) { return <div className="w-mono-caps">Шаг {step} из {TOTAL_STEPS}</div>; }
function Splash({ onNext }: { onNext: () => void }) { return <div className="onboarding__step onboarding__step--splash"><div><div className="onboarding__eyebrow">Ваша общая комната</div><h1 className="w-serif">Тамагочи<br /><em>вашей общей</em><br />жизни.</h1><p>Создайте маленький мир с человеком, который вам дорог.</p><div className="onboarding__promise"><span>✦</span><span>Общие моменты, без лишнего шума</span></div></div><WButton size="xl" onClick={onNext}>Создать Wego <span aria-hidden="true">→</span></WButton></div>; }
function TypeStep({ value, onChange, onNext }: { value: SpaceType; onChange: (value: SpaceType) => void; onNext: () => void }) { return <div className="onboarding__step"><div className="onboarding__copy"><StepLabel step={1} /><h2 className="w-serif">Для кого создаём<br />пространство?</h2><div className="stack">{typeOptions.map((option) => <button type="button" key={option.id} className={`type-option type-option--${option.tone} ${value === option.id ? "is-selected" : ""}`} onClick={() => onChange(option.id)} aria-pressed={value === option.id}><div><div className="w-serif">{option.label}</div><small>{option.description}</small></div><span aria-hidden="true">{value === option.id ? "✓" : ""}</span></button>)}</div></div><WButton size="xl" onClick={onNext}>Дальше <span aria-hidden="true">→</span></WButton></div>; }
function NameStep({ value, onChange, valid, onNext, busy }: { value: string; onChange: (value: string) => void; valid: boolean; onNext: () => void; busy: boolean }) { return <div className="onboarding__step"><div className="onboarding__copy"><StepLabel step={2} /><h2 className="w-serif">Как назовём<br />вашего Wego?</h2><label htmlFor="wego-name" className="field-label">Имя пространства</label><input id="wego-name" value={value} maxLength={24} onChange={(event) => onChange(event.target.value)} aria-invalid={!valid} aria-describedby="wego-name-help" /><p id="wego-name-help" className="field-help">До 24 символов. Это имя увидите только вы и ваш партнёр.</p><div className="chip-wrap">{names.map((item) => <WChip key={item} active={item === value} onClick={() => onChange(item)}>{item}</WChip>)}</div></div><WButton size="xl" loading={busy} disabled={!valid} onClick={onNext}>Создать комнату <span aria-hidden="true">→</span></WButton></div>; }
function InviteStep({ url, copied, onCopy, onShare, onNext }: { url: string; copied: boolean; onCopy: () => void; onShare: () => void; onNext: () => void }) { return <div className="onboarding__step"><div className="onboarding__copy"><StepLabel step={3} /><h2 className="w-serif">Пригласите<br />второго участника</h2><p>Ссылка уже готова. Отправьте её в Telegram — партнёр войдёт прямо в эту комнату.</p><WCard tone="lilac" className="invite-card"><div className="invite-card__link"><span className="w-mono-caps">Ссылка-приглашение</span><code>{url}</code></div><div className="invite-card__actions"><button type="button" onClick={onShare}>Отправить в Telegram <span aria-hidden="true">↗</span></button><button type="button" onClick={onCopy}>{copied ? "Скопировано ✓" : "Копировать"}</button></div></WCard><div className="invite-expectation"><WAvatar name="Вы" tone="coral" size={32} /><span>После входа вы оба увидите одну комнату, питомца и историю.</span></div></div><WButton size="xl" onClick={onNext}>Продолжить <span aria-hidden="true">→</span></WButton></div>; }
function RevealStep({ style, onStyleChange, onFinish }: { style: WegoStyle; onStyleChange: (style: WegoStyle) => void; onFinish: () => void }) { return <div className="onboarding__step onboarding__step--reveal"><div className="onboarding__copy"><StepLabel step={4} /><div className="style-switch" aria-label="Выбор настроения комнаты"><button type="button" className={style === "a" ? "is-active" : ""} onClick={() => onStyleChange("a")}>Тёплый</button><button type="button" className={style === "b" ? "is-active" : ""} onClick={() => onStyleChange("b")}>Уютный</button></div><img src={wegoAsset(style, "egg")} alt="Ваш Wego" className="wego-onboarding-art" /><h2 className="w-serif">Ваш Wego <em>появился</em></h2><p>Он будет расти вместе с тем, что вы делаете и говорите друг другу.</p></div><WButton size="xl" onClick={onFinish}>Открыть комнату <span aria-hidden="true">→</span></WButton></div>; }
