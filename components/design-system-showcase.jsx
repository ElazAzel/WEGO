// Design System showcase card — colors, type, components at a glance

function DesignSystemShowcase() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
      {/* Left column: palette + type */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <WSectionLabel>Type</WSectionLabel>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 24 }}>
            <div className="w-serif" style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.02em" }}>
              Тамагочи <em style={{ fontStyle: "italic" }}>вашей</em> жизни
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>Instrument Serif · 400 / italic</div>
            <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600 }}>Отметиться сегодня</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, marginTop: 6, color: "var(--plum)" }}>
                Основной текст — Geist Sans, 15/16 px, вес 400–600. Держим строгий сетчатый ритм, всё дышит.
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>Geist · 400 / 500 / 600</div>
            </div>
          </div>
        </div>

        <div>
          <WSectionLabel>Palette</WSectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {[
              ["cream", "#FFF8EF"],
              ["paper", "#FFFDF9"],
              ["peach", "#FFE7DB"],
              ["lilac", "#EEE6FA"],
              ["mint", "#DFF5EA"],
              ["yellow", "#FFF0BD"],
              ["coral", "#FF745F"],
              ["lilac-deep", "#C8B6EA"],
              ["plum", "#3B223D"],
              ["muted", "#8D7886"],
            ].map(([name, hex]) => (
              <div key={name}>
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 14, background: hex, border: "1px solid var(--line)" }} />
                <div style={{ fontSize: 10, fontWeight: 600, marginTop: 6 }}>{name}</div>
                <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "monospace" }}>{hex}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column: components */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <WSectionLabel>Buttons</WSectionLabel>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <WButton variant="primary">Отметиться</WButton>
              <WButton variant="lilac">Открыть Reveal</WButton>
              <WButton variant="mint">Готово</WButton>
              <WButton variant="secondary">Позже</WButton>
              <WButton variant="ghost">Пропустить</WButton>
            </div>
          </div>
        </div>

        <div>
          <WSectionLabel>Chips · Mood options</WSectionLabel>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOOD_OPTIONS.map((m) => <WChip key={m.id} tone={m.tone}>{m.label}</WChip>)}
          </div>
        </div>

        <div>
          <WSectionLabel>Cards</WSectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <WCard tone="lilac" style={{ padding: 14 }}>
              <div className="w-mono-caps" style={{ color: "#7A5CB8" }}>Reveal</div>
              <div className="w-serif" style={{ fontSize: 18, marginTop: 6 }}>Готов открыться</div>
            </WCard>
            <WCard tone="mint" style={{ padding: 14 }}>
              <div className="w-mono-caps" style={{ color: "#1F5A3E" }}>Активность</div>
              <div className="w-serif" style={{ fontSize: 18, marginTop: 6 }}>Прогулка</div>
            </WCard>
          </div>
        </div>

        <div>
          <WSectionLabel>Avatars & Wego stages</WSectionLabel>
          <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20, display: "flex", gap: 14, alignItems: "center" }}>
            <WAvatar name="Ильяс" tone="coral" size={44} />
            <WAvatar name="Аружан" tone="lilac" size={44} />
            <WAvatar name="+" tone="mint" size={44} />
            <div style={{ width: 1, height: 40, background: "var(--line)" }} />
            <img src="assets/wego/style-a-egg.png" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <img src="assets/wego/style-a-baby.png" style={{ width: 44, height: 44, objectFit: "contain" }} />
            <img src="assets/wego/style-a-adult.png" style={{ width: 44, height: 44, objectFit: "contain" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesignSystemShowcase });
