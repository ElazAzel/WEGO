// Reveal — 2 variants. Emotional heart of the product.

function RevealScreen({ variant, onClose, onSaveToStory }) {
  const { state } = useWego();
  if (variant === "v2") return <RevealV2 state={state} onClose={onClose} onSaveToStory={onSaveToStory} />;
  return <RevealV1 state={state} onClose={onClose} onSaveToStory={onSaveToStory} />;
}

function moodBy(id) { return MOOD_OPTIONS.find((m) => m.id === id); }
function energyBy(id) { return ENERGY_OPTIONS.find((m) => m.id === id); }
function wantBy(id) { return WANT_OPTIONS.find((m) => m.id === id); }

// ————— V1: Parallel cards —————
function RevealV1({ state, onClose, onSaveToStory }) {
  const t = state.today;
  const wego = wegoAsset(state.style, state.space.stage);
  const myMood = moodBy(t.myMood || "good");
  const partnerMood = moodBy(t.partnerMood);
  const guessCorrect = t.myGuess === t.partnerMood;

  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--lilac) 0%, var(--cream) 55%)", zIndex: 30, overflowY: "auto", animation: "wgFade 0.3s ease" }}>
      {/* Close */}
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="w-mono-caps" style={{ color: "#7A5CB8" }}>Reveal · Сегодня</div>
        <button onClick={onClose} style={{ background: "rgba(255,253,249,0.7)", border: "none", width: 36, height: 36, borderRadius: 999, fontSize: 18, cursor: "pointer", color: "var(--plum)" }}>×</button>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "8px 24px 0" }}>
        <div className="w-serif" style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-0.01em" }}>
          Reveal
          <br />
          <em style={{ fontStyle: "italic" }}>unlocked</em>
        </div>
      </div>

      {/* Parallel cards */}
      <div style={{ padding: "24px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <RevealCard person={state.me} mood={myMood} energy={energyBy(t.myEnergy)} want={wantBy(t.myWant)} note={t.myNote} tone="peach" />
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
          <div style={{ padding: "6px 12px", background: "rgba(255,253,249,0.8)", borderRadius: 999, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#7A5CB8", fontWeight: 600 }}>
            &nbsp;&darr;&nbsp;
          </div>
        </div>
        <RevealCard person={state.partner} mood={partnerMood} energy={energyBy(t.partnerEnergy)} want={wantBy(t.partnerWant)} tone="lilac" />
      </div>

      {/* Insight */}
      <div style={{ padding: "20px 16px 0" }}>
        <WCard tone="paper" style={{ padding: 20, textAlign: "center" }}>
          <div className="w-serif" style={{ fontSize: 22, lineHeight: 1.3 }}>
            У вас разный запас энергии,
            <br /> но обоим хочется быть рядом.
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
            Иногда этого уже достаточно.
          </div>
        </WCard>
      </div>

      {/* Guess result */}
      <div style={{ padding: "12px 16px 0" }}>
        <WCard tone={guessCorrect ? "mint" : "yellow"} style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24 }}>{guessCorrect ? "◉" : "◐"}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {guessCorrect ? "Ты угадал" : "Немного мимо"}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Ты думал: «{moodBy(t.myGuess)?.label || "…"}». На самом деле — «{partnerMood.label}».
            </div>
          </div>
        </WCard>
      </div>

      {/* Wego reaction */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 12, alignItems: "center", justifyContent: "center" }}>
        <img src={wego} alt="" style={{ width: 56, filter: "drop-shadow(0 4px 8px rgba(59,34,61,0.15))" }} />
        <div className="w-serif" style={{ fontSize: 18, lineHeight: 1.3 }}>
          Wego стал чуть мягче.
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: "20px 16px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        <WButton variant="primary" size="xl" onClick={onSaveToStory}>Сохранить в Story</WButton>
        <WButton variant="secondary" size="xl" onClick={onClose}>Закрыть</WButton>
      </div>
    </div>
  );
}

function RevealCard({ person, mood, energy, want, note, tone }) {
  return (
    <WCard tone={tone} style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <WAvatar name={person.name} tone={person.tone} size={38} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{person.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>сегодня</div>
        </div>
        <div className="w-serif" style={{ fontSize: 22 }}>{mood.label}</div>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
        {energy && <div style={{ fontSize: 12, padding: "6px 10px", background: "rgba(255,253,249,0.7)", borderRadius: 999, fontWeight: 500 }}>Энергия: {energy.label}</div>}
        {want && <div style={{ fontSize: 12, padding: "6px 10px", background: "rgba(255,253,249,0.7)", borderRadius: 999, fontWeight: 500 }}>Хочет: {want.label}</div>}
      </div>
      {note && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,253,249,0.7)", borderRadius: "var(--r-md)", fontSize: 13, fontStyle: "italic", color: "var(--plum)" }}>
          «{note}»
        </div>
      )}
    </WCard>
  );
}

// ————— V2: Envelope opens (cinematic) —————
function RevealV2({ state, onClose, onSaveToStory }) {
  const t = state.today;
  const wego = wegoAsset(state.style, state.space.stage);
  const [phase, setPhase] = React.useState(0); // 0 sealed, 1 opening, 2 open

  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const myMood = moodBy(t.myMood || "good");
  const partnerMood = moodBy(t.partnerMood);
  const guessCorrect = t.myGuess === t.partnerMood;

  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 20%, #D6C4F0 0%, var(--lilac) 40%, var(--cream) 90%)", zIndex: 30, overflow: "hidden", animation: "wgFade 0.3s ease" }}>
      {/* Close */}
      <div style={{ position: "absolute", top: 12, right: 16, zIndex: 4 }}>
        <button onClick={onClose} style={{ background: "rgba(255,253,249,0.7)", border: "none", width: 36, height: 36, borderRadius: 999, fontSize: 18, cursor: "pointer", color: "var(--plum)" }}>×</button>
      </div>

      {/* Sealed envelope stage */}
      {phase < 2 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            transition: "opacity 0.4s ease",
            opacity: phase === 1 ? 0 : 1,
          }}
        >
          <div className="w-mono-caps" style={{ color: "#7A5CB8", marginBottom: 12 }}>Sealed · Сегодняшний Reveal</div>
          <div
            style={{
              width: 240,
              height: 160,
              background: "linear-gradient(160deg, var(--paper) 0%, var(--peach) 100%)",
              borderRadius: 20,
              border: "1.5px solid var(--line-deep)",
              boxShadow: "0 20px 40px rgba(59,34,61,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              animation: "wgSeal 1.4s ease",
            }}
          >
            <div style={{
              position: "absolute",
              top: -80,
              left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 160,
              height: 160,
              background: "var(--coral)",
              borderRadius: 6,
              boxShadow: "0 4px 8px rgba(59,34,61,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{ transform: "rotate(-45deg)", color: "#fff", fontSize: 24 }}>♥</div>
            </div>
            <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
              для {state.me.name} и {state.partner.name}
            </div>
          </div>
        </div>
      )}

      {/* Opened content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          padding: "60px 20px 40px",
          opacity: phase === 2 ? 1 : 0,
          transform: phase === 2 ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="w-mono-caps" style={{ color: "#7A5CB8" }}>Reveal · {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</div>
          <div className="w-serif" style={{ fontSize: 52, lineHeight: 0.95, marginTop: 10, letterSpacing: "-0.02em" }}>
            <em style={{ fontStyle: "italic" }}>Открыто</em>
          </div>
        </div>

        <div style={{ padding: "24px 0 0", textAlign: "center" }}>
          <img src={wego} alt="" style={{ width: 140, filter: "drop-shadow(0 12px 20px rgba(59,34,61,0.18))" }} />
        </div>

        {/* Two moods facing each other */}
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", marginTop: 8 }}>
          <MoodFace person={state.me} mood={myMood} energy={energyBy(t.myEnergy)} note={t.myNote} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#7A5CB8" }}>
            <div style={{ width: 2, flex: 1, background: "var(--lilac-deep)", minHeight: 20 }} />
            <div style={{ fontSize: 12, padding: "6px 0", fontWeight: 600 }}>&</div>
            <div style={{ width: 2, flex: 1, background: "var(--lilac-deep)", minHeight: 20 }} />
          </div>
          <MoodFace person={state.partner} mood={partnerMood} energy={energyBy(t.partnerEnergy)} />
        </div>

        {/* Poetic conclusion */}
        <div style={{ textAlign: "center", padding: "26px 8px 0" }}>
          <div className="w-serif" style={{ fontSize: 26, lineHeight: 1.25 }}>
            У вас разный ритм,
            <br />
            но одна и та же тишина.
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
            {guessCorrect ? "Ты почувствовал это ещё до открытия." : "Иногда мы не совпадаем — и это тоже разговор."}
          </div>
        </div>

        <div style={{ padding: "28px 0 0", display: "flex", flexDirection: "column", gap: 10 }}>
          <WButton variant="lilac" size="xl" onClick={onSaveToStory}>Сохранить момент</WButton>
          <WButton variant="ghost" size="xl" onClick={onClose}>Закрыть</WButton>
        </div>
      </div>
    </div>
  );
}

function MoodFace({ person, mood, energy, note }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,253,249,0.85)", backdropFilter: "blur(8px)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 16 }}>
      <WAvatar name={person.name} tone={person.tone} size={36} style={{ marginBottom: 10 }} />
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{person.name}</div>
      <div className="w-serif" style={{ fontSize: 24, lineHeight: 1.1, marginTop: 4 }}>{mood.label}</div>
      {energy && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>Энергия · {energy.label}</div>}
      {note && <div style={{ marginTop: 10, fontSize: 12, fontStyle: "italic", color: "var(--plum)" }}>«{note}»</div>}
    </div>
  );
}

Object.assign(window, { RevealScreen });
