// Check-in bottom sheet: mood → energy → want → optional note → done
// Then automatically transitions into Guess

function CheckInSheet({ open, onClose, onCompleteToGuess }) {
  const { state, updateToday } = useWego();
  const [step, setStep] = React.useState(0);
  const [mood, setMood] = React.useState(state.today.myMood || null);
  const [energy, setEnergy] = React.useState(state.today.myEnergy || null);
  const [want, setWant] = React.useState(state.today.myWant || null);
  const [note, setNote] = React.useState(state.today.myNote || "");

  React.useEffect(() => {
    if (open) {
      setStep(0);
      setMood(state.today.myMood || null);
      setEnergy(state.today.myEnergy || null);
      setWant(state.today.myWant || null);
      setNote(state.today.myNote || "");
    }
  }, [open]);

  const canProceed = [mood, energy, want, true][step];
  const stepLabels = ["Как проходит день?", "Сколько энергии?", "Чего хочется?", "Что-то ещё?"];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateToday({ myMood: mood, myEnergy: energy, myWant: want, myNote: note });
      onCompleteToGuess();
    }
  };

  return (
    <WSheet open={open} onClose={onClose} height="92%">
      {/* Progress */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              background: i <= step ? "var(--coral)" : "var(--line)",
              borderRadius: 999,
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>

      <div className="w-mono-caps">Шаг {step + 1} из 4</div>
      <div className="w-serif" style={{ fontSize: 30, marginTop: 6, lineHeight: 1.1 }}>
        {stepLabels[step]}
      </div>

      <div style={{ marginTop: 24, paddingBottom: 100 }}>
        {step === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {MOOD_OPTIONS.map((m) => (
              <WChip
                key={m.id}
                tone={m.tone}
                active={mood === m.id}
                onClick={() => setMood(m.id)}
                style={{ padding: "12px 18px", fontSize: 15 }}
              >
                {m.label}
              </WChip>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ENERGY_OPTIONS.map((e) => (
              <button
                key={e.id}
                onClick={() => setEnergy(e.id)}
                style={{
                  border: `1.5px solid ${energy === e.id ? "var(--plum)" : "var(--line)"}`,
                  background: energy === e.id ? "var(--plum)" : "var(--paper)",
                  color: energy === e.id ? "#fff" : "var(--plum)",
                  borderRadius: "var(--r-lg)",
                  padding: "18px 20px",
                  fontSize: 17,
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WANT_OPTIONS.map((w) => (
              <WChip
                key={w.id}
                tone={w.tone}
                active={want === w.id}
                onClick={() => setWant(w.id)}
                style={{ padding: "12px 18px", fontSize: 15 }}
              >
                {w.label}
              </WChip>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 10 }}>
              Необязательно. Одна строчка, чтобы {state.partner.name} лучше понял.
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Сегодня просто адский дедлайн…"
              rows={4}
              style={{
                width: "100%",
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "var(--r-md)",
                padding: 14,
                fontSize: 15,
                fontFamily: "var(--font-sans)",
                color: "var(--plum)",
                resize: "none",
                outline: "none",
              }}
            />
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px 24px", background: "linear-gradient(180deg, transparent, var(--cream) 30%)" }}>
        <WButton variant="primary" size="xl" onClick={handleNext} disabled={!canProceed} style={{ opacity: canProceed ? 1 : 0.4 }}>
          {step < 3 ? "Дальше" : "Отправить"} →
        </WButton>
      </div>
    </WSheet>
  );
}

// Guess sheet — comes right after check-in
function GuessSheet({ open, onClose, onDone }) {
  const { state, updateToday } = useWego();
  const [guess, setGuess] = React.useState(state.today.myGuess || null);

  React.useEffect(() => {
    if (open) setGuess(state.today.myGuess || null);
  }, [open]);

  return (
    <WSheet open={open} onClose={onClose} height="82%">
      <div className="w-mono-caps">Guess</div>
      <div className="w-serif" style={{ fontSize: 28, marginTop: 6, lineHeight: 1.15 }}>
        Как думаешь, как сегодня {state.partner.name}?
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
        Твой ответ скрыт от {state.partner.name} до Reveal.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
        {MOOD_OPTIONS.map((m) => (
          <WChip
            key={m.id}
            tone={m.tone}
            active={guess === m.id}
            onClick={() => setGuess(m.id)}
            style={{ padding: "12px 18px", fontSize: 15 }}
          >
            {m.label}
          </WChip>
        ))}
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px 24px", background: "linear-gradient(180deg, transparent, var(--cream) 30%)" }}>
        <WButton
          variant="primary"
          size="xl"
          disabled={!guess}
          onClick={() => {
            updateToday({ myGuess: guess });
            onDone();
          }}
          style={{ opacity: guess ? 1 : 0.4 }}
        >
          Сохранить догадку →
        </WButton>
      </div>
    </WSheet>
  );
}

Object.assign(window, { CheckInSheet, GuessSheet });
