// Share cards — 3 templates: Evolution, Result, Memory
// Each is a 9:16 shareable graphic

function ShareCardsGallery() {
  const { state } = useWego();
  const wego = wegoAsset(state.style, state.space.stage);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, padding: "0 20px" }}>
      <EvolutionCard state={state} wego={wego} />
      <ResultCard state={state} wego={wego} />
      <MemoryCard state={state} wego={wego} />
    </div>
  );
}

function ShareCardShell({ children, tone = "cream", showLogo = true }) {
  return (
    <div style={{ aspectRatio: "9 / 16", width: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 22,
          background: tone === "lilac" ? "linear-gradient(180deg, var(--lilac) 0%, var(--paper) 90%)"
            : tone === "peach" ? "linear-gradient(180deg, var(--peach) 0%, var(--cream) 90%)"
            : tone === "mint" ? "linear-gradient(180deg, var(--mint) 0%, var(--paper) 90%)"
            : "var(--cream)",
          border: "1px solid var(--line)",
          overflow: "hidden",
          padding: 22,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
        {showLogo && (
          <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", fontWeight: 700, color: "var(--muted)" }}>WEGO</div>
            <div style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--muted)", marginTop: 3, textTransform: "uppercase" }}>
              Создайте своего Wego
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EvolutionCard({ state, wego }) {
  return (
    <div>
      <div className="w-mono-caps" style={{ marginBottom: 6 }}>Evolution</div>
      <ShareCardShell tone="lilac">
        <div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 600, color: "#7A5CB8" }}>OUR WEGO</div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <img src={wego} alt="" style={{ width: "60%", filter: "drop-shadow(0 8px 16px rgba(59,34,61,0.15))" }} />
        </div>
        <div className="w-serif" style={{ fontSize: 18, lineHeight: 1.15, textAlign: "center", color: "var(--plum)" }}>
          Прожили <em style={{ fontStyle: "italic" }}>28 дней</em>
          <br />
          и стал <em style={{ fontStyle: "italic" }}>Cozy Dreamer</em>
        </div>
        <div style={{ fontSize: 8, color: "var(--muted)", textAlign: "center", marginTop: 6, marginBottom: 20 }}>
          20 августа
        </div>
      </ShareCardShell>
    </div>
  );
}

function ResultCard({ state, wego }) {
  return (
    <div>
      <div className="w-mono-caps" style={{ marginBottom: 6 }}>Result</div>
      <ShareCardShell tone="peach">
        <div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 600, color: "var(--muted)" }}>КТО ИЗ НАС</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 4px" }}>
          <div className="w-serif" style={{ fontSize: 15, lineHeight: 1.2, textAlign: "center", color: "var(--plum)" }}>
            Мы оба думали,
            <br />
            что первым сорвётся
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <div style={{
              padding: "8px 14px",
              background: "var(--coral)",
              color: "#fff",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}>
              Ильяс
            </div>
          </div>
          <img src={wego} alt="" style={{ width: "40%", margin: "18px auto 0" }} />
        </div>
        <div style={{ fontSize: 8, color: "var(--muted)", textAlign: "center", marginTop: 6, marginBottom: 20 }}>
          Совпадение · 18 августа
        </div>
      </ShareCardShell>
    </div>
  );
}

function MemoryCard({ state, wego }) {
  return (
    <div>
      <div className="w-mono-caps" style={{ marginBottom: 6 }}>Memory</div>
      <ShareCardShell tone="mint">
        <div style={{ fontSize: 8, letterSpacing: "0.22em", fontWeight: 600, color: "#1F5A3E" }}>MOMENT</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <img src={wego} alt="" style={{ width: "50%", margin: "0 auto 14px" }} />
          <div className="w-serif" style={{ fontSize: 16, lineHeight: 1.25, textAlign: "center", color: "var(--plum)", fontStyle: "italic" }}>
            Сегодня мы просто вышли погулять.
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>
            А Wego сохранил этот вечер.
          </div>
        </div>
        <div style={{ fontSize: 8, color: "var(--muted)", textAlign: "center", marginTop: 6, marginBottom: 20 }}>
          16 августа · Ильяс & Аружан
        </div>
      </ShareCardShell>
    </div>
  );
}

Object.assign(window, { ShareCardsGallery, EvolutionCard, ResultCard, MemoryCard });
