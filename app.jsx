// WEGO main app — design canvas with all screens + live interactive frame

function App() {
  return (
    <WegoProvider>
      <StyleTumbler />
      <Hero />
      <div className="canvas">

        <Section
          eyebrow="Section 01 · Design system"
          title={<><em>Тёплая</em> и тихая система</>}
          desc="Instrument Serif держит эмоцию, Geist держит форму. Цвет — не украшение, а язык состояний: coral зовёт, lilac открывает, mint отвечает."
        >
          <DesignSystemShowcase />
        </Section>

        <Section
          eyebrow="Section 02 · Live prototype"
          title={<>Живой <em>флоу</em></>}
          desc="Один настоящий телефон с рабочим состоянием. Кликай Check-in → Guess → Reveal → Story. Всё сохраняется в localStorage — можно вернуться и продолжить."
        >
          <LivePrototype />
        </Section>

        <Section
          eyebrow="Section 03 · Home"
          title={<>Два <em>характера</em> главного экрана</>}
          desc="V1 — room-first, диорама как якорь. V2 — character-first, минимализм и Wego в фокусе. Оба ведут к одной кнопке."
        >
          <div className="frames-row">
            <FrameWithLabel label={<><strong>V1</strong> · Room-first</>}>
              <IsolatedHome variant="v1" />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>V2</strong> · Character-first</>}>
              <IsolatedHome variant="v2" />
            </FrameWithLabel>
          </div>
        </Section>

        <Section
          eyebrow="Section 04 · Check-in & Guess"
          title={<>Три шага, ни одного <em>лишнего</em></>}
          desc="Настроение → энергия → желание. Guess — отдельно, скрыт до Reveal. Прогресс сверху, sticky CTA снизу."
        >
          <div className="frames-row">
            <FrameWithLabel label={<><strong>01</strong> · Mood</>}>
              <IsolatedCheckin step={0} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>02</strong> · Energy</>}>
              <IsolatedCheckin step={1} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>03</strong> · Want</>}>
              <IsolatedCheckin step={2} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>04</strong> · Guess partner</>}>
              <IsolatedGuess />
            </FrameWithLabel>
          </div>
        </Section>

        <Section
          eyebrow="Section 05 · Reveal — эмоциональный центр"
          title={<>Два способа <em>раскрыться</em></>}
          desc="V1 — параллельные карточки, спокойное сравнение и подсказка от Wego. V2 — конверт раскрывается, поэтичная кинематика на 1.4 секунды."
        >
          <div className="frames-row">
            <FrameWithLabel label={<><strong>V1</strong> · Parallel cards</>}>
              <IsolatedReveal variant="v1" />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>V2</strong> · Envelope opens</>}>
              <IsolatedReveal variant="v2" />
            </FrameWithLabel>
          </div>
        </Section>

        <Section
          eyebrow="Section 06 · Together, Story, Мы"
          title={<>Остальные <em>вкладки</em></>}
          desc="Together — активности с фильтрами. Story — вертикальная лента моментов. «Мы» — вопрос дня и «Кто из нас»."
        >
          <div className="frames-row">
            <FrameWithLabel label={<><strong>Together</strong></>}>
              <IsolatedTogether />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>Story</strong></>}>
              <IsolatedStory />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>Мы</strong></>}>
              <IsolatedWe />
            </FrameWithLabel>
          </div>
        </Section>

        <Section
          eyebrow="Section 07 · Onboarding"
          title={<><em>60 секунд</em> до первого Wego</>}
          desc="Пять экранов, никаких форм на дюжину полей. Тип связи → имя → инвайт → появление."
        >
          <div className="frames-row">
            <FrameWithLabel label={<><strong>01</strong> · Splash</>}>
              <IsolatedOnb step={0} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>02</strong> · Type</>}>
              <IsolatedOnb step={1} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>03</strong> · Name</>}>
              <IsolatedOnb step={2} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>04</strong> · Invite</>}>
              <IsolatedOnb step={3} />
            </FrameWithLabel>
            <FrameWithLabel label={<><strong>05</strong> · Reveal</>}>
              <IsolatedOnb step={4} />
            </FrameWithLabel>
          </div>
        </Section>

        <Section
          eyebrow="Section 08 · Share cards"
          title={<>Вирусный слой — <em>три</em> шаблона</>}
          desc="9:16 вертикальные карточки. Evolution — про рост. Result — про совпадения. Memory — про тихие моменты."
        >
          <div style={{ maxWidth: 900 }}>
            <ShareCardsGallery />
          </div>
        </Section>

        <Footer />
      </div>
    </WegoProvider>
  );
}

// ————— Style tumbler (character/room stylistic variant) —————
function StyleTumbler() {
  const { state, update } = useWego();
  return (
    <div className="style-tumbler">
      <span className="style-tumbler-label">Стиль</span>
      <button className={state.style === "a" ? "active" : ""} onClick={() => update({ style: "a", room: "warm" })}>A · Premium</button>
      <button className={state.style === "b" ? "active" : ""} onClick={() => update({ style: "b", room: "morning" })}>B · Cozy</button>
    </div>
  );
}

// ————— Hero —————
function Hero() {
  return (
    <div className="hero">
      <div className="hero-eyebrow">WEGO · Design Prototype · для Codex</div>
      <div className="hero-title">
        Тамагочи<br />
        <em>вашей общей</em><br />
        жизни.
      </div>
      <div className="hero-subtitle">
        Приватное игровое пространство для двух близких людей. Не трекер отношений — а маленький живой мир, который растёт от того, что вы делаете вместе.
      </div>
      <div className="hero-meta">
        <div><strong>Ядро</strong> · Check-in → Guess → Reveal → Story → Share</div>
        <div><strong>Флоу</strong> · кликабельный, persist через localStorage</div>
        <div><strong>Ассеты</strong> · 6 Wego × 2 стиля + 2 комнаты</div>
      </div>
    </div>
  );
}

// ————— Section wrapper —————
function Section({ eyebrow, title, desc, children }) {
  return (
    <div className="section">
      <div className="section-header">
        <div className="section-eyebrow">{eyebrow}</div>
        <div className="section-title">{title}</div>
        <div className="section-desc">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function FrameWithLabel({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="frame-label">{label}</div>
      {children}
    </div>
  );
}

// ————— Live interactive prototype —————
function LivePrototype() {
  const { state, update, updateToday, addStory, bothAnswered, reset } = useWego();
  const [tab, setTab] = React.useState("wego");
  const [checkinOpen, setCheckinOpen] = React.useState(false);
  const [guessOpen, setGuessOpen] = React.useState(false);
  const [revealOpen, setRevealOpen] = React.useState(false);

  const openCheckin = () => setCheckinOpen(true);
  const closeCheckin = () => setCheckinOpen(false);
  const goToGuess = () => { setCheckinOpen(false); setTimeout(() => setGuessOpen(true), 260); };
  const guessDone = () => { setGuessOpen(false); setTimeout(() => setRevealOpen(true), 400); };
  const openReveal = () => setRevealOpen(true);
  const closeReveal = () => setRevealOpen(false);
  const saveToStory = () => {
    const my = MOOD_OPTIONS.find(m => m.id === state.today.myMood);
    const p = MOOD_OPTIONS.find(m => m.id === state.today.partnerMood);
    addStory({
      id: "r_" + Date.now(),
      date: new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
      type: "reveal",
      title: "Сегодняшний Reveal",
      body: `${state.me.name} — ${my?.label || "…"}. ${state.partner.name} — ${p.label}.`,
      tone: "lilac",
    });
    updateToday({ revealed: true });
    closeReveal();
    setTab("story");
  };

  return (
    <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
      <WPhoneFrame>
        {tab === "wego" && <HomeScreen variant={state.homeVariant} onCheckIn={openCheckin} onOpenReveal={openReveal} />}
        {tab === "we" && <WeTabScreen />}
        {tab === "together" && <TogetherScreen />}
        {tab === "story" && <StoryScreen onOpenShare={() => {}} />}
        <WTabBar current={tab} onChange={setTab} />
        <CheckInSheet open={checkinOpen} onClose={closeCheckin} onCompleteToGuess={goToGuess} />
        <GuessSheet open={guessOpen} onClose={() => setGuessOpen(false)} onDone={guessDone} />
        {revealOpen && <RevealScreen variant={state.revealVariant} onClose={closeReveal} onSaveToStory={saveToStory} />}
      </WPhoneFrame>

      {/* Side control panel */}
      <div style={{ maxWidth: 320, display: "flex", flexDirection: "column", gap: 18, paddingTop: 12 }}>
        <div>
          <div className="w-mono-caps">Управление</div>
          <div className="w-serif" style={{ fontSize: 26, lineHeight: 1.1, marginTop: 6 }}>
            Всё живое
          </div>
        </div>
        <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
          Меняй варианты главного экрана и Reveal — обновится в телефоне. Всё состояние сохраняется в localStorage: закрой вкладку, вернись — check-in и Reveal останутся на месте.
        </div>

        <div>
          <div className="w-mono-caps" style={{ marginBottom: 8 }}>Home variant</div>
          <div style={{ display: "flex", gap: 6 }}>
            <TumblerBtn active={state.homeVariant === "v1"} onClick={() => update({ homeVariant: "v1" })}>V1 · Room</TumblerBtn>
            <TumblerBtn active={state.homeVariant === "v2"} onClick={() => update({ homeVariant: "v2" })}>V2 · Character</TumblerBtn>
          </div>
        </div>

        <div>
          <div className="w-mono-caps" style={{ marginBottom: 8 }}>Reveal variant</div>
          <div style={{ display: "flex", gap: 6 }}>
            <TumblerBtn active={state.revealVariant === "v1"} onClick={() => update({ revealVariant: "v1" })}>V1 · Cards</TumblerBtn>
            <TumblerBtn active={state.revealVariant === "v2"} onClick={() => update({ revealVariant: "v2" })}>V2 · Envelope</TumblerBtn>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <div className="w-mono-caps" style={{ marginBottom: 8 }}>Быстрые действия</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <TumblerBtn onClick={openCheckin}>Открыть Check-in</TumblerBtn>
            <TumblerBtn onClick={openReveal} disabled={!bothAnswered}>Форсировать Reveal</TumblerBtn>
            <TumblerBtn onClick={() => { reset(); setTab("wego"); }}>Сбросить состояние</TumblerBtn>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
          Аружан уже «ответила» — её настроение зашито как <em>«{MOOD_OPTIONS.find(m => m.id === state.today.partnerMood)?.label}»</em> для демо. Ответь за Ильяса и открой Reveal.
        </div>
      </div>
    </div>
  );
}

function TumblerBtn({ active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        border: `1px solid ${active ? "var(--plum)" : "var(--line)"}`,
        background: active ? "var(--plum)" : "var(--paper)",
        color: active ? "#fff" : "var(--plum)",
        fontFamily: "var(--font-sans)",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}

// ————— Isolated frames for showcase (read from live state but locked to their variant) —————

function IsolatedHome({ variant }) {
  return (
    <WPhoneFrame>
      <HomeScreen variant={variant} onCheckIn={() => {}} onOpenReveal={() => {}} />
      <WTabBar current="wego" onChange={() => {}} />
    </WPhoneFrame>
  );
}

function IsolatedCheckin({ step }) {
  return (
    <WPhoneFrame>
      <HomeScreen variant="v1" onCheckIn={() => {}} onOpenReveal={() => {}} />
      <WTabBar current="wego" onChange={() => {}} />
      <CheckinPreview step={step} />
    </WPhoneFrame>
  );
}

function CheckinPreview({ step }) {
  const { state } = useWego();
  const stepLabels = ["Как проходит день?", "Сколько энергии?", "Чего хочется?"];
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(59,34,61,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 20,
      }}
    >
      <div style={{ width: "100%", height: "92%", background: "var(--cream)", borderRadius: "28px 28px 0 0", padding: "16px 20px 28px", overflow: "hidden" }}>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: "var(--line-deep)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {[0,1,2,3].map(i => (<div key={i} style={{ flex: 1, height: 4, background: i <= step ? "var(--coral)" : "var(--line)", borderRadius: 999 }} />))}
        </div>
        <div className="w-mono-caps">Шаг {step + 1} из 4</div>
        <div className="w-serif" style={{ fontSize: 28, marginTop: 6, lineHeight: 1.1 }}>{stepLabels[step]}</div>

        <div style={{ marginTop: 22 }}>
          {step === 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MOOD_OPTIONS.map((m) => (
                <WChip key={m.id} tone={m.tone} active={m.id === "good"} style={{ padding: "12px 18px", fontSize: 15 }}>{m.label}</WChip>
              ))}
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ENERGY_OPTIONS.map((e, i) => (
                <div key={e.id} style={{ border: `1.5px solid ${i === 1 ? "var(--plum)" : "var(--line)"}`, background: i === 1 ? "var(--plum)" : "var(--paper)", color: i === 1 ? "#fff" : "var(--plum)", borderRadius: "var(--r-lg)", padding: "18px 20px", fontSize: 17, fontWeight: 500 }}>{e.label}</div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {WANT_OPTIONS.map((w) => (
                <WChip key={w.id} tone={w.tone} active={w.id === "together"} style={{ padding: "12px 18px", fontSize: 15 }}>{w.label}</WChip>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IsolatedGuess() {
  const { state } = useWego();
  return (
    <WPhoneFrame>
      <HomeScreen variant="v1" onCheckIn={() => {}} onOpenReveal={() => {}} />
      <WTabBar current="wego" onChange={() => {}} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(59,34,61,0.35)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", zIndex: 20 }}>
        <div style={{ width: "100%", height: "82%", background: "var(--cream)", borderRadius: "28px 28px 0 0", padding: "16px 20px 28px" }}>
          <div style={{ width: 44, height: 5, borderRadius: 999, background: "var(--line-deep)", margin: "0 auto 16px" }} />
          <div className="w-mono-caps">Guess</div>
          <div className="w-serif" style={{ fontSize: 26, marginTop: 6, lineHeight: 1.15 }}>Как думаешь, как сегодня {state.partner.name}?</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>Твой ответ скрыт от {state.partner.name} до Reveal.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
            {MOOD_OPTIONS.map((m) => (
              <WChip key={m.id} tone={m.tone} active={m.id === "calm"} style={{ padding: "12px 18px", fontSize: 15 }}>{m.label}</WChip>
            ))}
          </div>
        </div>
      </div>
    </WPhoneFrame>
  );
}

function IsolatedReveal({ variant }) {
  return (
    <WegoRevealDemoProvider>
      <WPhoneFrame>
        <RevealScreen variant={variant} onClose={() => {}} onSaveToStory={() => {}} />
      </WPhoneFrame>
    </WegoRevealDemoProvider>
  );
}

// A wrapper that seeds my mood so isolated reveal renders "answered" state
function WegoRevealDemoProvider({ children }) {
  const { state, updateToday } = useWego();
  React.useEffect(() => {
    if (!state.today.myMood) {
      updateToday({ myMood: "good", myEnergy: "mid", myWant: "together", myNote: "Сегодня просто адский дедлайн", myGuess: "calm" });
    }
  }, []);
  return children;
}

function IsolatedTogether() {
  return (
    <WPhoneFrame>
      <TogetherScreen />
      <WTabBar current="together" onChange={() => {}} />
    </WPhoneFrame>
  );
}
function IsolatedStory() {
  return (
    <WPhoneFrame>
      <StoryScreen onOpenShare={() => {}} />
      <WTabBar current="story" onChange={() => {}} />
    </WPhoneFrame>
  );
}
function IsolatedWe() {
  return (
    <WPhoneFrame>
      <WeTabScreen />
      <WTabBar current="we" onChange={() => {}} />
    </WPhoneFrame>
  );
}

// Onboarding — isolated with fixed step
function IsolatedOnb({ step }) {
  const { state } = useWego();
  const wegoBaby = wegoAsset(state.style, "egg");
  const screens = [
    <OnbHero />,
    <OnbType />,
    <OnbName />,
    <OnbInvite />,
    <OnbReveal wego={wegoBaby} />,
  ];
  return (
    <WPhoneFrame>
      <div style={{ height: "100%", position: "relative" }}>
        {screens[step]}
        <div style={{ position: "absolute", top: 8, left: 20, right: 20, display: "flex", gap: 4 }}>
          {screens.map((_, k) => (
            <div key={k} style={{ flex: 1, height: 3, borderRadius: 999, background: k === step ? "var(--plum)" : "var(--line)" }} />
          ))}
        </div>
      </div>
    </WPhoneFrame>
  );
}

// Inline copies of onboarding screens so they don't need state
function OnbHero() {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, var(--peach) 0%, var(--cream) 60%)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="w-mono-caps">WEGO</div>
        <div className="w-serif" style={{ fontSize: 44, lineHeight: 1, marginTop: 12, letterSpacing: "-0.02em" }}>
          Тамагочи<br /><em style={{ fontStyle: "italic" }}>вашей общей</em><br />жизни.
        </div>
        <div style={{ fontSize: 15, color: "var(--muted)", marginTop: 18, lineHeight: 1.45 }}>Создайте маленький мир с человеком, который вам дорог.</div>
      </div>
      <WButton variant="primary" size="xl">Создать Wego</WButton>
    </div>
  );
}
function OnbType() {
  const types = [
    { id: "pair", label: "Пара", desc: "Для двоих влюблённых" },
    { id: "friends", label: "Друзья", desc: "Для лучших друзей" },
    { id: "family", label: "Семья", desc: "Для близких людей" },
  ];
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 1 из 4</div>
        <div className="w-serif" style={{ fontSize: 30, marginTop: 8, lineHeight: 1.1 }}>Для кого создаём<br />пространство?</div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
          {types.map((t, i) => (
            <div key={t.id} style={{ border: i === 0 ? "2px solid var(--plum)" : "1.5px solid var(--line)", background: "var(--paper)", borderRadius: "var(--r-lg)", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="w-serif" style={{ fontSize: 22, color: "var(--plum)" }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{t.desc}</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: 999, background: i === 0 ? "var(--plum)" : "transparent", border: `2px solid ${i === 0 ? "var(--plum)" : "var(--line-deep)"}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>{i === 0 ? "✓" : ""}</div>
            </div>
          ))}
        </div>
      </div>
      <WButton variant="primary" size="xl">Дальше →</WButton>
    </div>
  );
}
function OnbName() {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 2 из 4</div>
        <div className="w-serif" style={{ fontSize: 30, marginTop: 8, lineHeight: 1.1 }}>Как назовём<br />вашего Wego?</div>
        <div style={{ width: "100%", marginTop: 22, padding: "18px 20px", background: "var(--paper)", border: "1.5px solid var(--line-deep)", borderRadius: "var(--r-lg)", fontSize: 20, fontFamily: "var(--font-serif)", color: "var(--plum)" }}>Our Wego</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
          {["Our Wego", "Малыш", "Пу", "Момо", "Тэко"].map((s, i) => (<WChip key={s} active={i === 0}>{s}</WChip>))}
        </div>
      </div>
      <WButton variant="primary" size="xl">Дальше →</WButton>
    </div>
  );
}
function OnbInvite() {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1 }}>
        <div className="w-mono-caps">Шаг 3 из 4</div>
        <div className="w-serif" style={{ fontSize: 30, marginTop: 8, lineHeight: 1.1 }}>Пригласите<br />второго участника</div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12 }}>Отправьте ссылку — как только они присоединятся, ваш Wego появится.</div>
        <WCard tone="lilac" style={{ marginTop: 20, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4A3168" }}>t.me/wego/join/8f2k</div>
          <div style={{ fontSize: 12, background: "var(--plum)", color: "#fff", padding: "8px 12px", borderRadius: 999, fontWeight: 600 }}>Копировать</div>
        </WCard>
      </div>
      <WButton variant="primary" size="xl">Продолжить →</WButton>
    </div>
  );
}
function OnbReveal({ wego }) {
  return (
    <div style={{ height: "100%", padding: "40px 24px 32px", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, var(--lilac) 0%, var(--cream) 60%)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <img src={wego} alt="" style={{ width: 200, filter: "drop-shadow(0 12px 20px rgba(59,34,61,0.15))" }} />
        <div className="w-serif" style={{ fontSize: 36, marginTop: 20, lineHeight: 1 }}>Ваш Wego <em style={{ fontStyle: "italic" }}>появился</em></div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 12, maxWidth: 260 }}>Он будет расти вместе с тем, что вы делаете и говорите друг другу.</div>
      </div>
      <WButton variant="primary" size="xl">Начать →</WButton>
    </div>
  );
}

function Footer() {
  return (
    <div style={{ borderTop: "1px solid var(--line)", paddingTop: 40, marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
      <div>
        <div className="w-mono-caps">WEGO · Prototype v1</div>
        <div className="w-serif" style={{ fontSize: 28, marginTop: 8, maxWidth: 500, lineHeight: 1.2 }}>
          Дальше — <em>реальный код</em>. Этот файл — визуальная спецификация для Codex.
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, maxWidth: 320 }}>
        Все компоненты, токены и состояния уже описаны. Отдай Codex этот прототип + свой master-промпт — модель увидит визуальную истину, а не только текст.
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
