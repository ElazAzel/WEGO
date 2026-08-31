// "Мы" tab — daily question, who-of-us, reveal archive

const DAILY_QUESTIONS = [
  { q: "Какая моя привычка максимально NPC?", tone: "yellow" },
  { q: "В каком реалити-шоу я бы вылетел первым?", tone: "peach" },
  { q: "Что тебе хочется получить от меня сейчас?", tone: "lilac" },
];

const WHO_OF_US = [
  { q: "Кто скорее сорвётся завтра в путешествие?", left: "Ильяс", right: "Аружан", tone: "mint" },
  { q: "Кто первым заснёт во время фильма?", left: "Ильяс", right: "Аружан", tone: "yellow" },
  { q: "Кто переживёт зомби-апокалипсис?", left: "Ильяс", right: "Аружан", tone: "peach" },
];

function WeTabScreen() {
  const { state } = useWego();

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: "16px 20px 8px" }}>
        <div className="w-mono-caps">Мы</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 4, lineHeight: 1 }}>
          Узнавать друг друга
        </div>
      </div>

      {/* Daily Question hero */}
      <div style={{ padding: "12px 16px 0" }}>
        <WCard tone="lilac" style={{ padding: 22 }}>
          <div className="w-mono-caps" style={{ color: "#7A5CB8" }}>Вопрос дня</div>
          <div className="w-serif" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 8 }}>
            {DAILY_QUESTIONS[0].q}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 10 }}>
            Ответы скрыты до Reveal.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <WButton variant="lilac" size="md" style={{ flex: 1 }}>Ответить</WButton>
            <WButton variant="secondary" size="md">Пропустить</WButton>
          </div>
        </WCard>
      </div>

      {/* Who of us */}
      <div style={{ padding: "22px 16px 0" }}>
        <WSectionLabel>Кто из нас</WSectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WHO_OF_US.map((w, i) => (
            <WCard key={i} tone={w.tone} style={{ padding: 16 }}>
              <div className="w-serif" style={{ fontSize: 18, lineHeight: 1.2 }}>{w.q}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={{
                  flex: 1,
                  border: "1px solid var(--line-deep)",
                  background: "var(--paper)",
                  padding: "12px",
                  borderRadius: "var(--r-md)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "var(--plum)",
                }}>{w.left}</button>
                <button style={{
                  flex: 1,
                  border: "1px solid var(--line-deep)",
                  background: "var(--paper)",
                  padding: "12px",
                  borderRadius: "var(--r-md)",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "var(--plum)",
                }}>{w.right}</button>
              </div>
            </WCard>
          ))}
        </div>
      </div>

      {/* Archive */}
      <div style={{ padding: "22px 16px 0" }}>
        <WSectionLabel>Прошлые Reveal</WSectionLabel>
        <WCard tone="paper" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>18 августа</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Оба выбрали Ильяса</div>
            </div>
            <div style={{ color: "var(--muted)", fontSize: 18 }}>›</div>
          </div>
        </WCard>
      </div>
    </div>
  );
}

Object.assign(window, { WeTabScreen });
