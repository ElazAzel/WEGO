// Main Wego screen — two variants

function HomeScreen({ variant, onCheckIn, onOpenReveal }) {
  const { state, bothAnswered } = useWego();
  const room = roomAsset(state.room);
  const wego = wegoAsset(state.style, state.space.stage);
  const myAnswered = !!state.today.myMood;

  if (variant === "v2") return <HomeV2 state={state} wego={wego} onCheckIn={onCheckIn} onOpenReveal={onOpenReveal} bothAnswered={bothAnswered} myAnswered={myAnswered} />;
  return <HomeV1 state={state} room={room} wego={wego} onCheckIn={onCheckIn} onOpenReveal={onOpenReveal} bothAnswered={bothAnswered} myAnswered={myAnswered} />;
}

// ————— V1: Room-first, cozy diorama —————
function HomeV1({ state, room, wego, onCheckIn, onOpenReveal, bothAnswered, myAnswered }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: "12px 20px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="w-mono-caps">Our Space</div>
          <div className="w-serif" style={{ fontSize: 32, lineHeight: 1, marginTop: 4 }}>
            {state.space.name}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
            Маленький шаг для нас.
          </div>
        </div>
        <WAvatar name={state.me.name} tone={state.me.tone} size={40} />
      </div>

      {/* Diorama */}
      <div style={{ padding: "12px 16px 0" }}>
        <div
          style={{
            position: "relative",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
            background: "var(--peach)",
            border: "1px solid var(--line)",
            aspectRatio: "1 / 1.05",
          }}
        >
          <img src={room} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <img
            src={wego}
            alt=""
            style={{
              position: "absolute",
              bottom: "18%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "42%",
              filter: "drop-shadow(0 8px 12px rgba(59,34,61,0.2))",
              animation: "wgFloat 4s ease-in-out infinite",
            }}
          />
          {/* Days badge */}
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              background: "rgba(255,253,249,0.9)",
              backdropFilter: "blur(8px)",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--plum)",
              border: "1px solid var(--line)",
            }}
          >
            День {state.space.daysAlive} · {state.space.character}
          </div>
        </div>
      </div>

      {/* Participants strip */}
      <div style={{ display: "flex", gap: 10, padding: "16px 16px 0" }}>
        <ParticipantMini person={state.me} mood={state.today.myMood} energy={state.today.myEnergy} answered={myAnswered} />
        <ParticipantMini person={state.partner} mood={state.today.partnerMood} energy={state.today.partnerEnergy} answered={true} />
      </div>

      {/* Primary CTA + Reveal */}
      <div style={{ padding: "14px 16px 0" }}>
        {!myAnswered ? (
          <WButton variant="primary" size="xl" onClick={onCheckIn}>
            Отметиться сегодня →
          </WButton>
        ) : (
          <WCard tone="mint" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Твоя часть готова</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                Осталась догадка о том, как {state.partner.name}
              </div>
            </div>
            <div style={{ fontSize: 22 }}>✓</div>
          </WCard>
        )}
      </div>

      {/* Today's reveal card */}
      <div style={{ padding: "12px 16px 0" }}>
        <WCard tone={bothAnswered ? "lilac" : "paper"} style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="w-mono-caps" style={{ color: bothAnswered ? "#7A5CB8" : "var(--muted)" }}>
                Сегодняшний Reveal
              </div>
              <div className="w-serif" style={{ fontSize: 22, marginTop: 6, lineHeight: 1.15 }}>
                {bothAnswered ? "Готов открыться" : "Ждём вас обоих"}
              </div>
              <div style={{ fontSize: 13, color: bothAnswered ? "#4A3168" : "var(--muted)", marginTop: 6 }}>
                {bothAnswered ? "Вы оба ответили — можно заглянуть." : "Откроется, когда вы оба ответите."}
              </div>
            </div>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: bothAnswered ? "var(--lilac-deep)" : "var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 22,
              }}
            >
              {bothAnswered ? "◉" : "◌"}
            </div>
          </div>
          {bothAnswered && (
            <WButton variant="lilac" size="lg" onClick={onOpenReveal} style={{ width: "100%", marginTop: 14 }}>
              Открыть Reveal
            </WButton>
          )}
        </WCard>
      </div>

      {/* Insight */}
      <div style={{ padding: "12px 16px 20px" }}>
        <WCard tone="cream" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--paper)",
              border: "1px solid var(--line)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img src={wego} alt="" style={{ width: "160%" }} />
          </div>
          <div>
            <div className="w-mono-caps">Wego заметил</div>
            <div style={{ fontSize: 14, marginTop: 4, lineHeight: 1.4 }}>
              Вы чаще выбираете спокойные вечера дома.
            </div>
          </div>
        </WCard>
      </div>
    </div>
  );
}

// ————— V2: Character-first, minimal —————
function HomeV2({ state, wego, onCheckIn, onOpenReveal, bothAnswered, myAnswered }) {
  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 90, background: "linear-gradient(180deg, var(--lilac) 0%, var(--cream) 45%)" }}>
      {/* Top chips */}
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <WAvatar name={state.me.name} tone={state.me.tone} size={28} />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: myAnswered ? "var(--mint-deep)" : "var(--line-deep)",
            }}
          />
          <div style={{ width: 22, height: 1, background: "var(--line-deep)" }} />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--mint-deep)",
            }}
          />
          <WAvatar name={state.partner.name} tone={state.partner.tone} size={28} />
        </div>
        <div className="w-mono-caps">День {state.space.daysAlive}</div>
      </div>

      {/* Big character */}
      <div style={{ textAlign: "center", padding: "20px 20px 0" }}>
        <div className="w-mono-caps">Our Wego · {state.space.character}</div>
        <div className="w-serif" style={{ fontSize: 38, lineHeight: 1, marginTop: 8 }}>
          {state.space.name}
        </div>
      </div>

      <div style={{ position: "relative", padding: "8px 20px 0", textAlign: "center" }}>
        <img
          src={wego}
          alt=""
          style={{
            width: 260,
            filter: "drop-shadow(0 20px 30px rgba(59,34,61,0.15))",
            animation: "wgFloat 4s ease-in-out infinite",
          }}
        />
        {/* Ground shadow */}
        <div
          style={{
            width: 180,
            height: 12,
            background: "radial-gradient(ellipse, rgba(59,34,61,0.2) 0%, transparent 70%)",
            margin: "-20px auto 0",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* Wego whisper */}
      <div style={{ padding: "8px 20px 0", textAlign: "center" }}>
        <div className="w-serif" style={{ fontSize: 20, lineHeight: 1.3, color: "var(--plum)" }}>
          «Как у вас сегодня?»
        </div>
      </div>

      {/* Sticky CTAs */}
      <div style={{ padding: "20px 16px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
        {!myAnswered ? (
          <WButton variant="primary" size="xl" onClick={onCheckIn}>
            Отметиться сегодня
          </WButton>
        ) : bothAnswered ? (
          <WButton variant="lilac" size="xl" onClick={onOpenReveal}>
            Открыть сегодняшний Reveal ◉
          </WButton>
        ) : (
          <WButton variant="secondary" size="xl" disabled>
            Ждём {state.partner.name}
          </WButton>
        )}

        {/* Twin state chips */}
        <div style={{ display: "flex", gap: 8 }}>
          <StatusPill person={state.me} mood={state.today.myMood} energy={state.today.myEnergy} />
          <StatusPill person={state.partner} mood={state.today.partnerMood} energy={state.today.partnerEnergy} />
        </div>
      </div>
    </div>
  );
}

function ParticipantMini({ person, mood, energy, answered }) {
  const moodLabel = mood ? MOOD_OPTIONS.find((m) => m.id === mood)?.label : "—";
  const energyLabel = energy ? ENERGY_OPTIONS.find((e) => e.id === energy)?.label : "";
  return (
    <WCard tone="paper" style={{ flex: 1, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
      <WAvatar name={person.name} tone={person.tone} size={34} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--plum)" }}>{person.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {answered ? `${moodLabel}${energyLabel ? " · " + energyLabel : ""}` : "не ответил"}
        </div>
      </div>
    </WCard>
  );
}

function StatusPill({ person, mood, energy }) {
  const moodLabel = mood ? MOOD_OPTIONS.find((m) => m.id === mood)?.label : "…";
  const energyLabel = energy ? ENERGY_OPTIONS.find((e) => e.id === energy)?.label : "";
  return (
    <div
      style={{
        flex: 1,
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-md)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <WAvatar name={person.name} tone={person.tone} size={26} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{person.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>{moodLabel}{energyLabel ? " · " + energyLabel : ""}</div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
