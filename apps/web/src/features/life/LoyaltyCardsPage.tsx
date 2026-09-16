import { useState } from "react";
import { WButton, WCard } from "@wego/ui";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useLifeRecords } from "./life-api";

function barcodeBars(code: string) {
  return [...code].flatMap((char, index) => {
    const value = Number(char) || char.charCodeAt(0) % 10;
    return Array.from({ length: 3 + (value % 3) }, (_, offset) => ({ dark: offset % 2 === 0, width: 1 + ((value + index + offset) % 3) }));
  });
}

export function LoyaltyCardsPage() {
  const navigate = useNavigate();
  const { records, command, busy } = useLifeRecords("card");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = records.find(record => record.id === selectedId) ?? null;

  function addCard() {
    const cleanTitle = title.trim();
    const cleanCode = code.trim();
    if (!cleanTitle || !cleanCode) return;
    void command({ type: "put", id: `card-${Date.now()}`, kind: "card", data: { title: cleanTitle, code: cleanCode, format: "code128", offline: true }, expectedRevision: 0 });
    setTitle("");
    setCode("");
  }

  return <div className="app-page life-page"><PageHeader eyebrow="Всегда под рукой" title="Карты лояльности" description="Откройте карту на весь экран — даже без сети" action={<WButton size="sm" variant="secondary" onClick={() => navigate("/more")}>Назад</WButton>} /><div className="screen-padding stack">{records.map(record => <button type="button" className="loyalty-row" key={record.id} onClick={() => setSelectedId(record.id)}><WCard tone="peach"><div className="loyalty-row__icon" aria-hidden="true">▥</div><div className="life-row__body"><div className="life-title">{String(record.data.title)}</div><small>{String(record.data.format).toUpperCase()} · {String(record.data.code)} · {record.data.offline ? "доступна офлайн" : "только онлайн"}</small></div><span aria-hidden="true">→</span></WCard></button>)}<WCard tone="cream" className="life-form"><div className="w-mono-caps">Добавить карту</div><input aria-label="Название карты" value={title} onChange={event => setTitle(event.target.value)} placeholder="Например, Пятёрочка" /><input aria-label="Код карты" value={code} onChange={event => setCode(event.target.value.replace(/\s/g, ""))} inputMode="numeric" placeholder="Номер карты или код" /><WButton size="sm" disabled={!title.trim() || !code.trim() || busy} onClick={addCard}>Сохранить карту</WButton></WCard></div>{selected && <div className="loyalty-overlay" role="dialog" aria-modal="true" aria-label={`Карта ${String(selected.data.title)}`}><div className="loyalty-overlay__top"><button type="button" className="w-button w-button--ghost w-button--sm" onClick={() => setSelectedId(null)}>Готово</button><span className="w-mono-caps">Офлайн-карта</span></div><div className="loyalty-overlay__card"><div className="w-mono-caps">{String(selected.data.title)}</div><div className="w-serif">{String(selected.data.title)}</div><div className="loyalty-barcode" aria-hidden="true">{barcodeBars(String(selected.data.code)).map((bar, index) => <span key={`${index}-${bar.width}`} className={bar.dark ? "is-dark" : ""} style={{ width: `${bar.width * 3}px` }} />)}</div><div className="loyalty-code" aria-label={`Код карты ${String(selected.data.code)}`}>{String(selected.data.code)}</div><small>{String(selected.data.format).toUpperCase()} · покажите экран на кассе</small></div></div>}</div>;
}
