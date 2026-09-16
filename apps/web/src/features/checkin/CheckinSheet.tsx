import { useEffect, useState } from "react";
import { ENERGY_OPTIONS, MOOD_OPTIONS, WANT_OPTIONS } from "@wego/domain";
import { BottomSheet, WButton, WChip } from "@wego/ui";
import { haptic, hapticError } from "../../lib/telegram";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { apiFetch, isApiEnabled } from "../../lib/api-client";

const labels = ["Как проходит день?", "Сколько энергии?", "Чего хочется?", "Что-то ещё?"];

export function CheckinSheet() {
  const open = useUiStore((state) => state.sheet === "checkin");
  const closeSheet = useUiStore((state) => state.closeSheet);
  const openGuess = useUiStore((state) => state.openSheet);
  const today = useAppStore((state) => state.today);
  const space = useAppStore((state) => state.space);
  const hydrate = useAppStore((state) => state.hydrate);
  const submitCheckin = useAppStore((state) => state.submitCheckin);
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<typeof today.myMood>(null);
  const [energy, setEnergy] = useState<typeof today.myEnergy>(null);
  const [want, setWant] = useState<typeof today.myWant>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (open) { setStep(0); setMood(today.myMood); setEnergy(today.myEnergy); setWant(today.myWant); setNote(today.myNote); } }, [open, today.myEnergy, today.myMood, today.myNote, today.myWant]);
  const canProceed = step === 0 ? Boolean(mood) : step === 1 ? Boolean(energy) : step === 2 ? Boolean(want) : true;
  function previous() { if (step > 0) setStep((current) => current - 1); else closeSheet(); }

  async function next() {
    if (!canProceed) { hapticError(); return; }
    haptic();
    if (step < 3) { setStep((current) => current + 1); return; }
    setBusy(true); setError(null);
    try {
      if (isApiEnabled() && space && mood && energy && want) {
        await apiFetch(`/spaces/${space.id}/checkins/me`, { method: "POST", body: JSON.stringify({ date: today.date, mood, energy, want, note: note.trim(), clientMutationId: `checkin-${space.id}-${today.date}` }) });
        const remote = await apiFetch<RemoteToday>(`/spaces/${space.id}/today`);
        hydrate({ today: mapRemoteToday(remote, today) });
      } else {
        submitCheckin({ myMood: mood, myEnergy: energy, myWant: want, myNote: note.trim() });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить check-in.");
      return;
    } finally { setBusy(false); }
    closeSheet();
    window.setTimeout(() => openGuess("guess"), 260);
  }

  return <BottomSheet open={open} onClose={closeSheet} title="Сегодня"><div className="sheet-step-row"><button type="button" className="sheet-back" onClick={previous}>{step > 0 ? "← Назад" : "Закрыть"}</button><span className="w-mono-caps">Шаг {step + 1} из 4</span></div><div className="step-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step + 1} aria-label={`Шаг ${step + 1} из 4`}>{[0, 1, 2, 3].map((item) => <span key={item} className={item <= step ? "is-active" : ""} />)}</div><h3 className="w-serif sheet-question">{labels[step]}</h3>{error && <p className="onboarding-error" role="alert">{error}</p>}<div className="sheet-choice-area">{step === 0 && <div className="chip-wrap">{MOOD_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={mood === item.id} onClick={() => setMood(item.id)}>{item.emoji} {item.label}</WChip>)}</div>}{step === 1 && <div className="radio-stack">{ENERGY_OPTIONS.map((item) => <button type="button" key={item.id} className={energy === item.id ? "is-selected" : ""} aria-pressed={energy === item.id} onClick={() => setEnergy(item.id)}>{item.label}</button>)}</div>}{step === 2 && <div className="chip-wrap">{WANT_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={want === item.id} onClick={() => setWant(item.id)}>{item.label}</WChip>)}</div>}{step === 3 && <label className="note-field"><span>Необязательно. Одна строчка, чтобы партнёр лучше понял.</span><textarea value={note} maxLength={240} rows={4} placeholder="Сегодня просто адский дедлайн…" onChange={(event) => setNote(event.target.value)} /><small>{note.length}/240</small></label>}</div><div className="sheet-sticky-cta"><WButton size="xl" loading={busy} disabled={!canProceed || busy} onClick={() => void next()}>{step < 3 ? "Дальше" : "Отправить"} →</WButton></div></BottomSheet>;
}

type RemoteToday = { date: string; me: { mood: todayMood; energy: todayEnergy; want: todayWant; note: string | null; guess: todayGuess; revealed: boolean } | null; partner: { mood: todayMood; energy: todayEnergy; want: todayWant; note?: string | null } | null };
type TodayState = ReturnType<typeof useAppStore.getState>["today"];
type todayMood = TodayState["myMood"];
type todayEnergy = TodayState["myEnergy"];
type todayWant = TodayState["myWant"];
type todayGuess = TodayState["myGuess"];
function mapRemoteToday(remote: RemoteToday, current: TodayState): TodayState { return { ...current, date: remote.date, myMood: remote.me?.mood ?? null, myEnergy: remote.me?.energy ?? null, myWant: remote.me?.want ?? null, myNote: remote.me?.note ?? "", myGuess: remote.me?.guess ?? null, partnerMood: remote.partner?.mood ?? null, partnerEnergy: remote.partner?.energy ?? null, partnerWant: remote.partner?.want ?? null, partnerNote: remote.partner?.note ?? null, revealed: remote.me?.revealed ?? false }; }

export function GuessSheet() {
  const open = useUiStore((state) => state.sheet === "guess");
  const closeSheet = useUiStore((state) => state.closeSheet);
  const openReveal = useUiStore((state) => state.openReveal);
  const partnerName = useAppStore((state) => state.partner?.name ?? "партнёр");
  const partnerMood = useAppStore((state) => state.today.partnerMood);
  const today = useAppStore((state) => state.today);
  const space = useAppStore((state) => state.space);
  const hydrate = useAppStore((state) => state.hydrate);
  const savedGuess = useAppStore((state) => state.today.myGuess);
  const updateToday = useAppStore((state) => state.updateToday);
  const [guess, setGuess] = useState(savedGuess);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (open) setGuess(savedGuess); }, [open, savedGuess]);
  async function submit() { if (!guess) return; haptic(); setBusy(true); setError(null); try { if (isApiEnabled() && space) { await apiFetch(`/spaces/${space.id}/checkins/me/guess`, { method: "PUT", body: JSON.stringify({ date: today.date, guess }) }); const remote = await apiFetch<RemoteToday>(`/spaces/${space.id}/today`); hydrate({ today: mapRemoteToday(remote, today) }); } else updateToday({ myGuess: guess }); closeSheet(); window.setTimeout(() => { if (partnerMood) openReveal(); }, 400); } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить догадку."); } finally { setBusy(false); } }
  return <BottomSheet open={open} onClose={closeSheet} title="Угадать настроение" height="82%"><p className="w-serif guess-title">Как думаешь, как сегодня {partnerName}?</p><p className="muted-copy">Твой ответ скрыт от {partnerName} до раскрытия.</p>{error && <p className="onboarding-error" role="alert">{error}</p>}<div className="chip-wrap guess-chips">{MOOD_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={guess === item.id} onClick={() => setGuess(item.id)}>{item.emoji} {item.label}</WChip>)}</div><div className="sheet-sticky-cta"><WButton size="xl" loading={busy} disabled={!guess || busy} onClick={() => void submit()}>Сохранить догадку →</WButton></div></BottomSheet>;
}
