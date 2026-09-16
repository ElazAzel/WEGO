// Onboarding — 5 screens shown as a horizontal filmstrip inside the phone frame

function OnboardingFilmstrip() {
  const { state } = useWego();
  const [i, setI] = React.useState(0);
  const wegoBaby = wegoAsset(state.style, "egg");
  const wegoChar = wegoAsset(state.style, "adult");

  const screens = [
    <Onb1 next={() => setI(1)} />,
    <Onb2 next={() => setI(2)} />,
    <Onb3 next={() => setI(3)} />,
    <Onb4 next={() => setI(4)} />,
    <Onb5 back={() => setI(0)} wego={wegoBaby} />,
  ];

  return (
    <div style={{ height: "100%", position: "relative" }}>
      {screens[i]}
      <div style={{ position: "absolute", top: 8, left: 20, right: 20, display: "flex", gap: 4 }}>
        {screens.map((_, k) => (
          <div key={k} style={{ flex: 1, height: 3, borderRadius: 999, background: k === i ? "var(--plum)" : "var(--line)" }} />
        ))}
      </div>
    </div>
  );
}

function Onb1({ next }) {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, var(--peach) 0%, var(--cream) 60%)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="w-mono-caps">WEGO</div>
        <div className="w-serif" style={{ fontSize: 48, lineHeight: 1, marginTop: 12, letterSpacing: "-0.02em" }}>
          Тамагочи
          <br />
          <em style={{ fontStyle: "italic" }}>вашей общей</em>
          <br />
          жизни.
        </div>
        <div style={{ fontSize: 15, color: "var(--muted)", marginTop: 18, lineHeight: 1.45 }}>
          Создайте маленький мир с человеком, который вам дорог.
        </div>
      </div>
      <WButton variant="primary" size="xl" onClick={next}>Создать Wego</WButton>
    </div>
  );
}

function Onb2({ next }) {
  const [type, setType] = React.useState("pair");
  const types = [
    { id: "pair", label: "Пара", desc: "Для двоих влюблённых", tone: "coral" },
    { id: "friends", label: "Друзья", desc: "Для лучших друзей", tone: "yellow" },
    { id: "family", label: "Семья", desc: "Для близких людей", tone: "mint" },
  ];
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 1 из 4</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 8, lineHeight: 1.1 }}>
          Для кого создаём
          <br />
          пространство?
        </div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {types.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              style={{
                border: type === t.id ? "2px solid var(--plum)" : "1.5px solid var(--line)",
                background: type === t.id ? "var(--paper)" : "var(--paper)",
                borderRadius: "var(--r-lg)",
                padding: "16px 18px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.15s ease",
              }}
            >
              <div>
                <div className="w-serif" style={{ fontSize: 22, color: "var(--plum)" }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{t.desc}</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: type === t.id ? "var(--plum)" : "transparent", border: `2px solid ${type === t.id ? "var(--plum)" : "var(--line-deep)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>
                {type === t.id ? "✓" : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
      <WButton variant="primary" size="xl" onClick={next}>Дальше →</WButton>
    </div>
  );
}

function Onb3({ next }) {
  const [name, setName] = React.useState("Our Wego");
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 2 из 4</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 8, lineHeight: 1.1 }}>
          Как назовём
          <br />
          вашего Wego?
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%",
            marginTop: 22,
            padding: "18px 20px",
            background: "var(--paper)",
            border: "1.5px solid var(--line-deep)",
            borderRadius: "var(--r-lg)",
            fontSize: 20,
            fontFamily: "var(--font-serif)",
            color: "var(--plum)",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
          {["Our Wego", "Малыш", "Пу", "Момо", "Тэко"].map((s) => (
            <WChip key={s} onClick={() => setName(s)} active={name === s}>{s}</WChip>
          ))}
        </div>
      </div>
      <WButton variant="primary" size="xl" onClick={next}>Дальше →</WButton>
    </div>
  );
}

function Onb4({ next }) {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 3 из 4</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 8, lineHeight: 1.1 }}>
          Пригласите
          <br />
          второго участника
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12, lineHeight: 1.45 }}>
          Отправьте ссылку — как только они присоединятся, ваш Wego появится.
        </div>
        <WCard tone="lilac" style={{ marginTop: 20, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4A3168" }}>t.me/wego/join/8f2k</div>
          <button style={{ fontSize: 12, background: "var(--plum)", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 999, fontFamily: "var(--font-sans)", fontWeight: 600, cursor: "pointer" }}>
            Копировать
          </button>
        </WCard>
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <WButton variant="secondary" size="md" style={{ flex: 1 }}>Через Telegram</WButton>
          <WButton variant="secondary" size="md" style={{ flex: 1 }}>QR-код</WButton>
        </div>
      </div>
      <WButton variant="primary" size="xl" onClick={next}>Продолжить →</WButton>
    </div>
  );
}

function Onb5({ back, wego }) {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, var(--lilac) 0%, var(--cream) 60%)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <img src={wego} alt="" style={{ width: 200, filter: "drop-shadow(0 12px 20px rgba(59,34,61,0.15))", animation: "wgFloat 4s ease-in-out infinite" }} />
        <div className="w-serif" style={{ fontSize: 40, marginTop: 20, lineHeight: 1 }}>
          Ваш Wego <em style={{ fontStyle: "italic" }}>появился</em>
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12, maxWidth: 260 }}>
          Он будет расти вместе с тем, что вы делаете и говорите друг другу.
        </div>
      </div>
      <WButton variant="primary" size="xl" onClick={back}>Начать →</WButton>
    </div>
  );
}

Object.assign(window, { OnboardingFilmstrip });
