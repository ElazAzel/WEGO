import { useState } from "react";
import { canReveal, energyLabel, moodLabel } from "@wego/domain";
import { WAvatar, WButton, WCard, Icon } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { wegoAsset } from "../../lib/asset";
import { haptic, isTelegram, openTelegramShare } from "../../lib/telegram";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { apiFetch, isApiEnabled } from "../../lib/api-client";
import { LivingRoomScene } from "../world/LivingRoomScene";
import { GameHud } from "../world/GameHud";
import { HomeSummary } from "./HomeSummary";
import { useLifeRecords } from "../life/life-api";
import { useNavigate } from "react-router-dom";

export function HomePage() {
  const navigate = useNavigate();
  const { space, me, partner, today, homeVariant, setPartnerDemo } = useAppStore();
  const { records: calendarRecords } = useLifeRecords("calendar");
  const openSheet = useUiStore((state) => state.openSheet);
  const openReveal = useUiStore((state) => state.openReveal);
  if (!space || !me) return null;
  const bothAnswered = canReveal({ myMood: today.myMood, partnerMood: today.partnerMood });
  const myAnswered = Boolean(today.myMood);
  const art = wegoAsset(space.style, space.stage);
  const nextCalendarRecord = calendarRecords.filter(record => Date.parse(String(record.data.start)) >= Date.now()).sort((a, b) => Date.parse(String(a.data.start)) - Date.parse(String(b.data.start)))[0];
  const nextEvent = nextCalendarRecord ? { title: String(nextCalendarRecord.data.title), dateLabel: relativeDateLabel(String(nextCalendarRecord.data.start)) } : { title: "Добавьте вашу ближайшую дату", dateLabel: "Откройте календарь" };
  const openAccount = () => navigate("/settings");
  if (homeVariant === "v2") return <HomeV2 space={space} me={me} partner={partner} today={today} art={art} myAnswered={myAnswered} bothAnswered={bothAnswered} openSheet={() => openSheet("checkin")} openReveal={openReveal} openAccount={openAccount} />;
  return <HomeV1 space={space} me={me} partner={partner} today={today} art={art} myAnswered={myAnswered} bothAnswered={bothAnswered} openSheet={() => openSheet("checkin")} openReveal={openReveal} setPartnerDemo={setPartnerDemo} nextEvent={nextEvent} openAccount={openAccount} />;
}

type Props = { space: NonNullable<ReturnType<typeof useAppStore.getState>["space"]>; me: NonNullable<ReturnType<typeof useAppStore.getState>["me"]>; partner: ReturnType<typeof useAppStore.getState>["partner"]; today: ReturnType<typeof useAppStore.getState>["today"]; art: string; myAnswered: boolean; bothAnswered: boolean; openSheet: () => void; openReveal: () => void; setPartnerDemo?: () => void; nextEvent?: { title: string; dateLabel: string }; openAccount: () => void };

function HomeV1({ space, me, partner, today, art, myAnswered, bothAnswered, openSheet, openReveal, setPartnerDemo, nextEvent, openAccount }: Props) {
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  async function shareInvite() {
    setInviteBusy(true); setInviteStatus(null);
    try {
      let url = `https://t.me/${import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "wego_app_bot"}/app?startapp=join_${space.id}`;
      if (isApiEnabled()) url = (await apiFetch<{ url: string }>(`/spaces/${space.id}/invitations`, { method: "POST" })).url;
      if (isTelegram()) { openTelegramShare(url, "Присоединись к нашей комнате WEGO"); setInviteStatus("Открылось окно отправки в Telegram"); }
      else { await navigator.clipboard.writeText(url); setInviteStatus("Ссылка скопирована"); }
    } catch (cause) { setInviteStatus(cause instanceof Error ? cause.message : "Не удалось создать приглашение."); }
    finally { setInviteBusy(false); }
  }
  return <div className="app-page home-page"><PageHeader eyebrow="Наша комната" title={space.name} description={partner ? `Вы вместе с ${partner.name}. Маленький шаг для вас двоих.` : "Сейчас здесь только вы — пригласите партнёра, чтобы начать вместе."} action={<button type="button" className="account-entry" aria-label="Открыть аккаунт" onClick={openAccount}><WAvatar name={me.name} tone={me.tone} size={42} /></button>} /><HomeSummary daysTogether={space.daysAlive} nextEvent={nextEvent ?? { title: "Добавьте вашу ближайшую дату", dateLabel: "Откройте календарь" }} myAnswered={myAnswered} partnerAnswered={Boolean(today.partnerMood)} partnerName={partner?.name} /><div className="screen-padding"><LivingRoomScene room={space.room} style={space.style} stage={space.stage} daysAlive={space.daysAlive} character={space.character} /></div><div className="screen-padding"><GameHud /></div><div className="participants screen-padding"><Participant person={me} mood={today.myMood} energy={today.myEnergy} answered={myAnswered} /><Participant person={partner} mood={today.partnerMood} energy={today.partnerEnergy} answered={Boolean(today.partnerMood)} /></div>{!partner && <div className="screen-padding"><WCard tone="yellow" className="partner-invite-card"><div className="w-mono-caps">Следующий шаг</div><div className="w-serif card-title">Позовите партнёра в комнату</div><p>Партнёр войдёт через Telegram и сразу увидит эту же комнату, Вего и общие действия.</p><WButton variant="secondary" loading={inviteBusy} onClick={() => void shareInvite()}>Отправить приглашение <span aria-hidden="true">↗</span></WButton>{inviteStatus && <small className={`invite-feedback ${inviteStatus.includes("Не удалось") ? "is-error" : ""}`} role="status">{inviteStatus}</small>}</WCard></div>}<div className="screen-padding">{!myAnswered ? <WButton size="xl" onClick={() => { haptic(); openSheet(); }}>Отметиться сегодня <span aria-hidden="true">→</span></WButton> : <WCard tone="mint" className="ready-card"><div><strong>Твоя часть готова</strong><small>{partner ? `Осталась догадка о том, как ${partner.name}` : "Ждём второго участника"}</small></div><Icon name="check" /></WCard>}</div><div className="screen-padding"><WCard tone={bothAnswered ? "lilac" : "paper"}><div className="w-mono-caps">Сегодняшний Reveal</div><div className="w-serif card-title">{bothAnswered ? "Готов открыться" : "Ждём вас обоих"}</div><p>{bothAnswered ? "Вы оба ответили — можно заглянуть." : "Откроется, когда вы оба ответите."}</p>{bothAnswered && <WButton variant="lilac" size="lg" onClick={() => { haptic(); openReveal(); }}>Открыть Reveal</WButton>}</WCard></div><div className="screen-padding"><WCard tone="cream" className="insight-card"><img src={art} alt="" /><div><div className="w-mono-caps">Наблюдение Wego</div><p>Эти маленькие ответы со временем складываются в вашу общую историю.</p></div></WCard></div>{import.meta.env.DEV && setPartnerDemo && <div className="screen-padding"><button type="button" className="dev-link" onClick={setPartnerDemo}>Локальный preview: ответ партнёра</button></div>}</div>;
}

function relativeDateLabel(value: string) { const days = Math.max(0, Math.ceil((Date.parse(value) - Date.now()) / 86400000)); if (days === 0) return "сегодня"; if (days === 1) return "завтра"; return `через ${days} ${days % 10 === 1 && days % 100 !== 11 ? "день" : days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20) ? "дня" : "дней"}`; }

function HomeV2({ space, me, partner, today, art, myAnswered, bothAnswered, openSheet, openReveal, openAccount }: Props) { return <div className="app-page home-page home-page--v2"><div className="v2-top"><div className="row"><WAvatar name={me.name} tone={me.tone} size={30} /><span className={`answer-dot ${myAnswered ? "is-ready" : ""}`} /><span className="answer-line" /><span className={`answer-dot ${today.partnerMood ? "is-ready" : ""}`} /><WAvatar name={partner?.name ?? "?"} tone={partner?.tone ?? "paper"} size={30} /></div><button type="button" className="account-entry" aria-label="Открыть аккаунт" onClick={openAccount}><WAvatar name={me.name} tone={me.tone} size={30} /></button><div className="w-mono-caps">День {space.daysAlive}</div></div><div className="v2-title"><div className="w-mono-caps">Our Wego · {space.character}</div><div className="w-serif">{space.name}</div></div><div className="v2-art"><img src={art} alt="" /><span /></div><div className="v2-whisper w-serif">«Как у вас сегодня?»</div><div className="v2-actions">{!myAnswered ? <WButton size="xl" onClick={openSheet}>Отметиться сегодня</WButton> : bothAnswered ? <WButton variant="lilac" size="xl" onClick={openReveal}>Открыть сегодняшний Reveal ◉</WButton> : <WButton variant="secondary" size="xl" disabled>Ждём партнёра</WButton>}<div className="status-pills"><div><WAvatar name={me.name} tone={me.tone} size={26} /><small>{moodLabel(today.myMood)}</small></div><div><WAvatar name={partner?.name ?? "?"} tone={partner?.tone ?? "paper"} size={26} /><small>{moodLabel(today.partnerMood)}</small></div></div></div>{!partner && <div className="screen-padding v2-invite-hint"><button type="button" onClick={openAccount}>Пригласить партнёра в аккаунте <span aria-hidden="true">→</span></button></div>}</div>; }

function Participant({ person, mood, energy, answered }: { person: ReturnType<typeof useAppStore.getState>["me"] | ReturnType<typeof useAppStore.getState>["partner"]; mood: ReturnType<typeof useAppStore.getState>["today"]["myMood"]; energy: ReturnType<typeof useAppStore.getState>["today"]["myEnergy"]; answered: boolean }) { return <WCard tone="paper" className={`participant ${person ? "" : "is-missing"}`}><WAvatar name={person?.name ?? "?"} tone={person?.tone ?? "paper"} size={34} /><div><strong>{person?.name ?? "Второй участник"}</strong><small>{answered ? `${moodLabel(mood)}${energy ? ` · ${energyLabel(energy)}` : ""}` : "ещё не подключён"}</small></div>{!person && <span className="participant__status" aria-hidden="true">+</span>}</WCard>; }
