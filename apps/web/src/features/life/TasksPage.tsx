import { useMemo, useState } from "react";
import { WButton, WCard, WChip } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { useLifeRecords } from "./life-api";

type TaskFilter = "all" | "mine" | "partner" | "free";

export function TasksPage() {
  const { records, command, busy } = useLifeRecords("task");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const tasks = useMemo(() => records.filter(record => {
    const assignee = record.data.assigneeId;
    if (filter === "mine") return assignee === "local-preview";
    if (filter === "partner") return Boolean(assignee) && assignee !== "local-preview";
    if (filter === "free") return !assignee;
    return true;
  }).sort((a, b) => Number(a.data.status === "done") - Number(b.data.status === "done")), [filter, records]);
  const active = tasks.filter(task => task.data.status !== "done");
  const completed = tasks.filter(task => task.data.status === "done");
  const renderTask = (task: typeof tasks[number]) => {
    const done = task.data.status === "done";
    const mine = task.data.assigneeId === "local-preview";
    const partnerTask = Boolean(task.data.assigneeId) && !mine;
    return <WCard key={task.id} tone={done ? "cream" : mine ? "mint" : partnerTask ? "peach" : "paper"} className={`life-row task-row ${done ? "is-done" : ""}`}><button className="task-check" aria-label={done ? "Выполнено" : "Выполнить"} onClick={() => { if (!done) void command({ type: "complete", id: task.id, expectedRevision: task.revision }); }} /> <div className="life-row__body"><div className="life-title">{String(task.data.title)}</div><small>{task.data.due ? `до ${task.data.due}` : "без срока"} · {mine ? "взял(а) ты" : partnerTask ? "взял(а) партнёр" : "свободно"}</small></div>{!mine && !partnerTask && !done && <WButton size="sm" variant="secondary" disabled={busy} onClick={() => void command({ type: "claimTask", id: task.id, expectedRevision: task.revision })}>Беру</WButton>}</WCard>;
  };
  return <div className="app-page life-page"><PageHeader eyebrow="Общий ритм" title="Дела" description="Свободные задачи, которые можно взять на себя одним касанием" action={<WButton size="sm" onClick={() => document.getElementById("new-task")?.focus()}>+ Дело</WButton>} /><div className="filter-row screen-padding">{([["all", "Все"], ["mine", "Мои"], ["partner", "Партнёра"], ["free", "Свободные"]] as const).map(([id, label]) => <WChip key={id} active={filter === id} onClick={() => setFilter(id)}>{label}{id === "all" ? ` · ${tasks.length}` : ""}</WChip>)}</div><div className="screen-padding stack">{active.length > 0 && <div className="task-group-label">В работе · {active.length}</div>}{active.map(renderTask)}{completed.length > 0 && <div className="task-group-label">Завершено · {completed.length}</div>}{completed.map(renderTask)}{tasks.length === 0 && <WCard tone="cream"><div className="life-title">Ничего не найдено</div><p>Попробуйте другой фильтр или добавьте новую задачу.</p></WCard>}<WCard tone="cream" className="life-form"><div className="w-mono-caps">Новая задача</div><input id="new-task" value={title} onChange={event => setTitle(event.target.value)} placeholder="Что нужно сделать?" /><label className="date-field">Срок <input aria-label="Срок задачи" type="date" value={due} onChange={event => setDue(event.target.value)} /></label><WButton size="sm" disabled={!title.trim() || busy} onClick={() => { void command({ type: "put", id: `task-${Date.now()}`, kind: "task", data: { title, ...(due ? { due } : {}), assigneeId: null, status: "open", repeat: "none", description: "" }, expectedRevision: 0 }); setTitle(""); setDue(""); }}>Добавить</WButton></WCard></div></div>;
}
