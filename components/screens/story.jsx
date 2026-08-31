// Story timeline

function StoryScreen({ onOpenShare }) {
  const { state } = useWego();

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: "16px 20px 8px" }}>
        <div className="w-mono-caps">Story</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 4, lineHeight: 1 }}>
          Ваша история
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
          {state.story.length} моментов · день {state.space.daysAlive}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {state.story.map((m, i) => (
          <StoryItem key={m.id} moment={m} isFirst={i === 0} onShare={() => onOpenShare(m)} />
        ))}
      </div>
    </div>
  );
}

function StoryItem({ moment, isFirst, onShare }) {
  const typeLabel = {
    evolution: "Эволюция",
    result: "Результат",
    activity: "Активность",
    note: "Записка",
    reveal: "Reveal",
  }[moment.type] || moment.type;

  return (
    <WCard tone={moment.tone} style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div className="w-mono-caps">{typeLabel} · {moment.date}</div>
        {isFirst && <div style={{ fontSize: 10, padding: "3px 8px", background: "var(--paper)", borderRadius: 999, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Новое</div>}
      </div>
      <div className="w-serif" style={{ fontSize: 22, lineHeight: 1.2 }}>{moment.title}</div>
      <div style={{ fontSize: 14, color: "var(--plum)", marginTop: 8, lineHeight: 1.4 }}>{moment.body}</div>
      <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
        <WButton variant="secondary" size="sm" onClick={onShare}>Поделиться</WButton>
      </div>
    </WCard>
  );
}

Object.assign(window, { StoryScreen });
