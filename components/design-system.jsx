// WEGO — Design System
// Tokens + primitives. Load AFTER React/Babel, BEFORE screens.

const WegoTokens = {
  cream: "#FFF8EF",
  paper: "#FFFDF9",
  plum: "#3B223D",
  muted: "#8D7886",
  coral: "#FF745F",
  coralDark: "#E85A45",
  peach: "#FFE7DB",
  lilac: "#EEE6FA",
  lilacDeep: "#C8B6EA",
  mint: "#DFF5EA",
  mintDeep: "#8ED0AF",
  yellow: "#FFF0BD",
  yellowDeep: "#F0C449",
  line: "#F0E3D8",
  lineDeep: "#E4D2C1",
};

const wegoBaseStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&display=swap');

  :root {
    --cream: ${WegoTokens.cream};
    --paper: ${WegoTokens.paper};
    --plum: ${WegoTokens.plum};
    --muted: ${WegoTokens.muted};
    --coral: ${WegoTokens.coral};
    --coral-dark: ${WegoTokens.coralDark};
    --peach: ${WegoTokens.peach};
    --lilac: ${WegoTokens.lilac};
    --lilac-deep: ${WegoTokens.lilacDeep};
    --mint: ${WegoTokens.mint};
    --mint-deep: ${WegoTokens.mintDeep};
    --yellow: ${WegoTokens.yellow};
    --yellow-deep: ${WegoTokens.yellowDeep};
    --line: ${WegoTokens.line};
    --line-deep: ${WegoTokens.lineDeep};

    --font-serif: 'Instrument Serif', 'Times New Roman', serif;
    --font-sans: 'Geist', -apple-system, system-ui, sans-serif;

    --r-sm: 12px;
    --r-md: 20px;
    --r-lg: 28px;
    --r-xl: 36px;
    --r-pill: 999px;

    --shadow-soft: 0 1px 0 rgba(59,34,61,0.04), 0 8px 24px rgba(59,34,61,0.06);
    --shadow-card: 0 2px 0 var(--line), 0 12px 32px rgba(59,34,61,0.08);
  }

  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { margin: 0; font-family: var(--font-sans); color: var(--plum); background: var(--cream); }

  .w-serif { font-family: var(--font-serif); font-weight: 400; letter-spacing: -0.01em; }
  .w-mono-caps { font-family: var(--font-sans); font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; font-size: 11px; color: var(--muted); }
`;

// ————— Primitives —————

function WButton({ children, variant = "primary", size = "md", onClick, style, ...rest }) {
  const base = {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    borderRadius: "var(--r-pill)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "transform 0.12s ease, background 0.15s ease",
    letterSpacing: "-0.005em",
  };
  const sizes = {
    sm: { padding: "10px 18px", fontSize: 14 },
    md: { padding: "14px 22px", fontSize: 15 },
    lg: { padding: "18px 28px", fontSize: 16 },
    xl: { padding: "20px 26px", fontSize: 17, width: "100%" },
  };
  const variants = {
    primary: { background: "var(--coral)", color: "#fff", boxShadow: "0 2px 0 var(--coral-dark)" },
    secondary: { background: "var(--paper)", color: "var(--plum)", boxShadow: "0 2px 0 var(--line-deep)", border: "1px solid var(--line)" },
    ghost: { background: "transparent", color: "var(--plum)" },
    lilac: { background: "var(--lilac-deep)", color: "#fff", boxShadow: "0 2px 0 #A891D8" },
    mint: { background: "var(--mint-deep)", color: "#0F3C25", boxShadow: "0 2px 0 #6BB995" },
  };
  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => (e.currentTarget.style.transform = "translateY(1px)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

function WChip({ children, active, onClick, tone = "default", style }) {
  const tones = {
    default: { bg: "var(--paper)", color: "var(--plum)", border: "var(--line)" },
    coral: { bg: "var(--peach)", color: "#8A3A2C", border: "#F5C9B7" },
    lilac: { bg: "var(--lilac)", color: "#4A3168", border: "#D9CAF0" },
    mint: { bg: "var(--mint)", color: "#1F5A3E", border: "#B8E1CA" },
    yellow: { bg: "var(--yellow)", color: "#6A4A0A", border: "#EFD9A0" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "9px 14px",
        borderRadius: "var(--r-pill)",
        background: active ? "var(--plum)" : t.bg,
        color: active ? "#fff" : t.color,
        border: `1px solid ${active ? "var(--plum)" : t.border}`,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        transition: "all 0.15s ease",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function WCard({ children, tone = "paper", style, ...rest }) {
  const tones = {
    paper: { bg: "var(--paper)", border: "var(--line)" },
    peach: { bg: "var(--peach)", border: "#F5C9B7" },
    lilac: { bg: "var(--lilac)", border: "#D9CAF0" },
    mint: { bg: "var(--mint)", border: "#B8E1CA" },
    yellow: { bg: "var(--yellow)", border: "#EFD9A0" },
    cream: { bg: "var(--cream)", border: "var(--line)" },
    coral: { bg: "#FFD7CE", border: "#F5B5A5" },
  };
  const t = tones[tone] || tones.paper;
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: "var(--r-lg)",
        padding: 20,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

function WSectionLabel({ children, style }) {
  return (
    <div className="w-mono-caps" style={{ marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

function WAvatar({ name, tone = "coral", size = 40, style }) {
  const tones = {
    coral: "var(--coral)",
    lilac: "var(--lilac-deep)",
    mint: "var(--mint-deep)",
    yellow: "var(--yellow-deep)",
  };
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: tones[tone],
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        fontSize: size * 0.4,
        letterSpacing: "-0.01em",
        border: "2px solid var(--paper)",
        ...style,
      }}
    >
      {name.charAt(0)}
    </div>
  );
}

// Bottom sheet within a device frame
function WSheet({ open, onClose, children, height = "88%" }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(59,34,61,0.35)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 20,
        animation: "wgFade 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          height,
          background: "var(--cream)",
          borderRadius: "28px 28px 0 0",
          padding: "16px 20px 28px",
          overflowY: "auto",
          animation: "wgSlideUp 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.2)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 5,
            borderRadius: 999,
            background: "var(--line-deep)",
            margin: "0 auto 16px",
          }}
        />
        {children}
      </div>
    </div>
  );
}

// TabBar for the phone frame
function WTabBar({ current, onChange }) {
  const tabs = [
    { id: "wego", label: "Wego", icon: "◐" },
    { id: "we", label: "Мы", icon: "◑" },
    { id: "together", label: "Вместе", icon: "◔" },
    { id: "story", label: "Story", icon: "◕" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(255,248,239,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--line)",
        padding: "10px 12px 24px",
        display: "flex",
        justifyContent: "space-around",
        zIndex: 10,
      }}
    >
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              border: "none",
              background: "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              padding: "6px 14px",
              fontFamily: "var(--font-sans)",
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: active ? "var(--coral)" : "var(--muted)",
                transition: "color 0.15s ease",
              }}
            >
              {tab.icon}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: active ? "var(--plum)" : "var(--muted)",
                letterSpacing: "-0.01em",
              }}
            >
              {tab.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Mood options used across Check-in / Guess / Reveal
const MOOD_OPTIONS = [
  { id: "great", label: "Отлично", tone: "yellow", emoji: "☀" },
  { id: "good", label: "Хорошо", tone: "mint", emoji: "◐" },
  { id: "calm", label: "Спокойно", tone: "lilac", emoji: "◑" },
  { id: "normal", label: "Обычно", tone: "default", emoji: "◔" },
  { id: "overloaded", label: "Перегружен", tone: "coral", emoji: "◕" },
  { id: "hard", label: "Тяжело", tone: "default", emoji: "◒" },
  { id: "irritated", label: "Раздражён", tone: "coral", emoji: "◓" },
];

const ENERGY_OPTIONS = [
  { id: "high", label: "Много" },
  { id: "mid", label: "Нормально" },
  { id: "low", label: "Мало" },
];

const WANT_OPTIONS = [
  { id: "together", label: "Побыть вместе", tone: "mint" },
  { id: "talk", label: "Поговорить", tone: "lilac" },
  { id: "rest", label: "Отдохнуть", tone: "yellow" },
  { id: "alone", label: "Побыть одному", tone: "default" },
  { id: "fun", label: "Развлечься", tone: "coral" },
  { id: "walk", label: "Погулять", tone: "mint" },
  { id: "support", label: "Поддержки", tone: "lilac" },
];

Object.assign(window, {
  WegoTokens,
  wegoBaseStyle,
  WButton,
  WChip,
  WCard,
  WSectionLabel,
  WAvatar,
  WSheet,
  WTabBar,
  MOOD_OPTIONS,
  ENERGY_OPTIONS,
  WANT_OPTIONS,
});
