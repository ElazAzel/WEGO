import { useEffect, useState } from "react";
import { ENERGY_OPTIONS, MOOD_OPTIONS, WANT_OPTIONS } from "@wego/domain";
import { BottomSheet, WButton, WChip } from "@wego/ui";
import { haptic, hapticError } from "../../lib/telegram";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const labels = ["Как проходит день?", "Сколько энергии?", "Чего хочется?", "Что-то ещё?"];

export function CheckinSheet() {
  const open = useUiStore((state) => state.sheet === "checkin");
  const closeSheet = useUiStore((state) => state.closeSheet);
  const openGuess = useUiStore((state) => state.openSheet);
  const today = useAppStore((state) => state.today);
  const submitCheckin = useAppStore((state) => state.submitCheckin);
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<typeof today.myMood>(null);
  const [energy, setEnergy] = useState<typeof today.myEnergy>(null);
  const [want, setWant] = useState<typeof today.myWant>(null);
  const [note, setNote] = useState("");

  useEffect(() => { if (open) { setStep(0); setMood(today.myMood); setEnergy(today.myEnergy); setWant(today.myWant); setNote(today.myNote); } }, [open, today.myEnergy, today.myMood, today.myNote, today.myWant]);
  const canProceed = step === 0 ? Boolean(mood) : step === 1 ? Boolean(energy) : step === 2 ? Boolean(want) : true;

  function next() {
    if (!canProceed) { hapticError(); return; }
    haptic();
    if (step < 3) { setStep((current) => current + 1); return; }
    submitCheckin({ myMood: mood, myEnergy: energy, myWant: want, myNote: note.trim() });
    closeSheet();
    window.setTimeout(() => openGuess("guess"), 260);
  }

  return <BottomSheet open={open} onClose={closeSheet} title="Check-in"><div className="step-progress" aria-label={`Шаг ${step + 1} из 4`}>{[0, 1, 2, 3].map((item) => <span key={item} className={item <= step ? "is-active" : ""} />)}</div><div className="w-mono-caps">Шаг {step + 1} из 4</div><h3 className="w-serif sheet-question">{labels[step]}</h3><div className="sheet-choice-area">{step === 0 && <div className="chip-wrap">{MOOD_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={mood === item.id} onClick={() => setMood(item.id)}>{item.emoji} {item.label}</WChip>)}</div>}{step === 1 && <div className="radio-stack">{ENERGY_OPTIONS.map((item) => <button type="button" key={item.id} className={energy === item.id ? "is-selected" : ""} aria-pressed={energy === item.id} onClick={() => setEnergy(item.id)}>{item.label}</button>)}</div>}{step === 2 && <div className="chip-wrap">{WANT_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={want === item.id} onClick={() => setWant(item.id)}>{item.label}</WChip>)}</div>}{step === 3 && <label className="note-field"><span>Необязательно. Одна строчка, чтобы партнёр лучше понял.</span><textarea value={note} maxLength={240} rows={4} placeholder="Сегодня просто адский дедлайн…" onChange={(event) => setNote(event.target.value)} /><small>{note.length}/240</small></label>}</div><div className="sheet-sticky-cta"><WButton size="xl" disabled={!canProceed} onClick={next}>{step < 3 ? "Дальше" : "Отправить"} →</WButton></div></BottomSheet>;
}

export function GuessSheet() {
  const open = useUiStore((state) => state.sheet === "guess");
  const closeSheet = useUiStore((state) => state.closeSheet);
  const openReveal = useUiStore((state) => state.openReveal);
  const partnerName = useAppStore((state) => state.partner?.name ?? "партнёр");
  const partnerMood = useAppStore((state) => state.today.partnerMood);
  const savedGuess = useAppStore((state) => state.today.myGuess);
  const updateToday = useAppStore((state) => state.updateToday);
  const [guess, setGuess] = useState(savedGuess);
  useEffect(() => { if (open) setGuess(savedGuess); }, [open, savedGuess]);
  function submit() { if (!guess) return; haptic(); updateToday({ myGuess: guess }); closeSheet(); window.setTimeout(() => { if (partnerMood) openReveal(); }, 400); }
  return <BottomSheet open={open} onClose={closeSheet} title="Guess" height="82%"><p className="w-serif guess-title">Как думаешь, как сегодня {partnerName}?</p><p className="muted-copy">Твой ответ скрыт от {partnerName} до Reveal.</p><div className="chip-wrap guess-chips">{MOOD_OPTIONS.map((item) => <WChip key={item.id} tone={item.tone} active={guess === item.id} onClick={() => setGuess(item.id)}>{item.emoji} {item.label}</WChip>)}</div><div className="sheet-sticky-cta"><WButton size="xl" disabled={!guess} onClick={submit}>Сохранить догадку →</WButton></div></BottomSheet>;
}
