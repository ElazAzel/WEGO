// Together tab — shared activities

const TOGETHER_ACTIVITIES = [
  { id: "a1", title: "Три фото из старой галереи", desc: "Покажите друг другу по три фотографии из старой галереи.", duration: "5 мин", tags: ["дома", "спокойное"], tone: "mint" },
  { id: "a2", title: "Странный снек до 1000 ₸", desc: "Купите друг другу самый странный снек в магазине.", duration: "30 мин", tags: ["улица", "смешное"], tone: "yellow" },
  { id: "a3", title: "Прогулка без телефонов", desc: "20 минут на улице без экранов.", duration: "20 мин", tags: ["улица", "спокойное"], tone: "mint" },
  { id: "a4", title: "Wego выбирает фильм", desc: "Каждый выбирает — случайный жребий решит.", duration: "вечер", tags: ["дома", "спонтанное"], tone: "lilac" },
  { id: "a5", title: "Максимально плохое фото", desc: "Сделайте самое ужасное совместное селфи.", duration: "5 мин", tags: ["дома", "смешное"], tone: "peach" },
  { id: "a6", title: "Записка без слов", desc: "Каждый пишет другому короткую записку. Читать только вечером.", duration: "5 мин", tags: ["спокойное"], tone: "lilac" },
];

const FILTERS = ["все", "дома", "улица", "смешное", "спокойное", "спонтанное"];

function TogetherScreen({ onPlan }) {
  const { state, update } = useWego();
  const [filter, setFilter] = React.useState("все");

  const filtered = filter === "все" ? TOGETHER_ACTIVITIES : TOGETHER_ACTIVITIES.filter((a) => a.tags.includes(filter));

  return (
    <div style={{ height: "100%", overflowY: "auto", paddingBottom: 90 }}>
      <div style={{ padding: "16px 20px 8px" }}>
        <div className="w-mono-caps">Вместе</div>
        <div className="w-serif" style={{ fontSize: 32, marginTop: 4, lineHeight: 1 }}>
          Что-нибудь сделаем?
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
          Каждая активность — воспоминание для Wego.
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 16px 12px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {FILTERS.map((f) => (
          <WChip key={f} active={filter === f} onClick={() => setFilter(f)} style={{ flexShrink: 0 }}>
            {f}
          </WChip>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((a) => {
          const planned = state.plannedActivities.includes(a.id);
          return (
            <WCard key={a.id} tone={a.tone} style={{ padding: 16, display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>
                    {a.duration}
                  </div>
                </div>
                <div className="w-serif" style={{ fontSize: 20, lineHeight: 1.15 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: "var(--plum)", marginTop: 6, lineHeight: 1.4 }}>{a.desc}</div>
              </div>
              <button
                onClick={() => {
                  const p = state.plannedActivities;
                  update({ plannedActivities: planned ? p.filter((x) => x !== a.id) : [...p, a.id] });
                  if (!planned) onPlan && onPlan(a);
                }}
                style={{
                  alignSelf: "center",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: planned ? "var(--plum)" : "var(--paper)",
                  border: `1px solid ${planned ? "var(--plum)" : "var(--line-deep)"}`,
                  color: planned ? "#fff" : "var(--plum)",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                {planned ? "✓" : "+"}
              </button>
            </WCard>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { TogetherScreen });
