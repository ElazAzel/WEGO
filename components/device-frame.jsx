// Compact Telegram Mini App phone frame (390 x 844 viewport)

function WPhoneFrame({ children, label, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
      {label && (
        <div className="w-mono-caps" style={{ paddingLeft: 8 }}>
          {label}
        </div>
      )}
      <div
        style={{
          width: 390,
          height: 844,
          background: "#0F0A11",
          borderRadius: 54,
          padding: 12,
          boxShadow: "0 30px 80px rgba(59,34,61,0.14), 0 6px 0 #050205",
          position: "relative",
          ...style,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 42,
            background: "var(--cream)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Telegram-style top bar */}
          <div
            style={{
              height: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--plum)",
              fontFamily: "var(--font-sans)",
              flexShrink: 0,
            }}
          >
            <div>9:41</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 18, height: 10, borderRadius: 2, border: "1.5px solid var(--plum)", position: "relative" }}>
                <div style={{ position: "absolute", left: 1, top: 1, bottom: 1, width: "70%", background: "var(--plum)", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* Notch */}
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              width: 100,
              height: 28,
              background: "#0F0A11",
              borderRadius: 999,
            }}
          />

          <div style={{ position: "absolute", inset: "44px 0 0 0", overflow: "hidden" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WPhoneFrame });
