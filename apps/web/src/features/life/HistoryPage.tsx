import { useMemo, useState } from "react";
import { WButton, WCard, WChip } from "@wego/ui";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useLifeRecords } from "./life-api";

type HistoryTab = "question" | "capsule" | "memory";

export function HistoryPage() {
  const navigate = useNavigate();
  const { records: questions } = useLifeRecords("question");
  const { records: capsules, command: capsuleCommand, busy: capsuleBusy } = useLifeRecords("capsule");
  const { records: memories, command: memoryCommand, busy: memoryBusy } = useLifeRecords("memory");
  const [tab, setTab] = useState<HistoryTab>("question");
  const [answer, setAnswer] = useState<string | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState("");
  const [capsuleBody, setCapsuleBody] = useState("");
  const [opensAt, setOpensAt] = useState("2027-01-01T00:00");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryBody, setMemoryBody] = useState("");
  const question = questions[0];
  const visibleCapsules = useMemo(() => [...capsules].sort((a, b) => Date.parse(String(a.data.opensAt)) - Date.parse(String(b.data.opensAt))), [capsules]);

  function addCapsule() {
    if (!capsuleTitle.trim() || !capsuleBody.trim()) return;
    void capsuleCommand({ type: "put", id: `capsule-${Date.now()}`, kind: "capsule", data: { title: capsuleTitle.trim(), body: capsuleBody.trim(), opensAt: new Date(opensAt).toISOString(), attachmentIds: [] }, expectedRevision: 0 });
    setCapsuleTitle("");
    setCapsuleBody("");
  }

  function addMemory() {
    if (!memoryTitle.trim()) return;
    void memoryCommand({ type: "put", id: `memory-${Date.now()}`, kind: "memory", data: { title: memoryTitle.trim(), body: memoryBody.trim(), date: new Date().toISOString().slice(0, 10), album: "2026", attachmentIds: [] }, expectedRevision: 0 });
    setMemoryTitle("");
    setMemoryBody("");
  }

  return <div className="app-page life-page"><PageHeader eyebrow="Близость и история" title="Наши моменты" description="Вопросы, письма в будущее и память, которую вы собираете вдвоём" action={<WButton size="sm" variant="secondary" onClick={() => navigate("/more")}>Назад</WButton>} /><div className="filter-row screen-padding history-tabs"><WChip active={tab === "question"} onClick={() => setTab("question")}>Вопрос дня</WChip><WChip active={tab === "capsule"} onClick={() => setTab("capsule")}>Капсулы</WChip><WChip active={tab === "memory"} onClick={() => setTab("memory")}>Воспоминания</WChip></div>{tab === "question" && <div className="screen-padding stack"><WCard tone="mint"><div className="w-mono-caps">Вопрос дня · ответы скрыты</div><div className="w-serif question-title">{String(question?.data.title ?? "Что хочется сохранить в этой неделе?")}</div><p>Каждый отвечает у себя. Совпадение откроется только после двух ответов.</p><div className="choice-grid">{((question?.data.options as string[] | undefined) ?? ["Тёплый вечер", "Новая идея", "Маленькое приключение"]).map(option => <WButton key={option} variant={answer === option ? "mint" : "secondary"} onClick={() => setAnswer(option)}>{option}</WButton>)}</div>{answer && <div className="history-answer" role="status">Твой ответ сохранён. Ждём ответ партнёра.</div>}</WCard><WCard tone="paper"><div className="w-mono-caps">Как это работает</div><p>После ответа второго участника WEGO покажет совпадение и добавит вопрос в историю. Закрытый ответ не попадёт в питомца, уведомления или рекламу.</p></WCard></div>}{tab === "capsule" && <div className="screen-padding stack">{visibleCapsules.map(record => { const locked = Date.parse(String(record.data.opensAt)) > Date.now(); return <WCard key={record.id} tone={locked ? "lilac" : "peach"} className="capsule-row"><div className="capsule-row__icon" aria-hidden="true">{locked ? "◷" : "✉"}</div><div><div className="life-title">{String(record.data.title)}</div><p>{locked ? `Откроется ${new Date(String(record.data.opensAt)).toLocaleDateString("ru-RU")}` : String(record.data.body)}</p></div></WCard>; })}<WCard tone="cream" className="life-form"><div className="w-mono-caps">Новая капсула времени</div><input aria-label="Название капсулы" value={capsuleTitle} onChange={event => setCapsuleTitle(event.target.value)} placeholder="Письмо нам через год" /><textarea aria-label="Текст капсулы" value={capsuleBody} onChange={event => setCapsuleBody(event.target.value)} placeholder="Что хочется сказать себе будущим?" rows={4} /><label className="date-field">Открыть после <input type="datetime-local" value={opensAt} onChange={event => setOpensAt(event.target.value)} /></label><WButton size="sm" disabled={!capsuleTitle.trim() || !capsuleBody.trim() || capsuleBusy} onClick={addCapsule}>Запечатать письмо</WButton></WCard></div>}{tab === "memory" && <div className="screen-padding stack">{memories.map(record => <WCard key={record.id} tone="peach" className="memory-row"><div className="w-mono-caps">{String(record.data.album ?? "Общее")} · {String(record.data.date)}</div><div className="life-title">{String(record.data.title)}</div><p>{String(record.data.body)}</p></WCard>)}<WCard tone="cream" className="life-form"><div className="w-mono-caps">Добавить воспоминание</div><input aria-label="Название воспоминания" value={memoryTitle} onChange={event => setMemoryTitle(event.target.value)} placeholder="Что хочется оставить в истории?" /><textarea aria-label="Текст воспоминания" value={memoryBody} onChange={event => setMemoryBody(event.target.value)} placeholder="Один маленький момент…" rows={3} /><WButton size="sm" disabled={!memoryTitle.trim() || memoryBusy} onClick={addMemory}>Сохранить момент</WButton></WCard></div>}</div>;
}
