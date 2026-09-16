import { useMemo, useState } from "react";
import { WButton, WCard, WChip } from "@wego/ui";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useLifeRecords } from "./life-api";

function noteText(content: unknown): string {
  if (!content || typeof content !== "object") return "Пустая заметка";
  const nodes = (content as { content?: Array<{ content?: Array<{ text?: string }> }> }).content ?? [];
  return nodes.flatMap(node => node.content ?? []).map(item => item.text ?? "").join(" ") || "Пустая заметка";
}

export function NotesPage() {
  const navigate = useNavigate();
  const { records, command, busy } = useLifeRecords("note");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("Все");
  const [title, setTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const folders = useMemo(() => ["Все", ...new Set(records.map(record => String(record.data.folder ?? "Общее")).filter(Boolean))], [records]);
  const visible = records.filter(record => {
    const haystack = `${record.data.title} ${noteText(record.data.content)} ${(record.data.tags as string[] | undefined)?.join(" ")}`.toLocaleLowerCase();
    return (folder === "Все" || String(record.data.folder ?? "Общее") === folder) && haystack.includes(query.toLocaleLowerCase());
  });
  const selected = records.find(record => record.id === selectedId) ?? null;

  function addNote() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    void command({ type: "put", id: `note-${Date.now()}`, kind: "note", data: { title: cleanTitle, content: { type: "doc", content: [{ type: "paragraph", content: [] }] }, folder: "Общее", tags: [], attachmentIds: [] }, expectedRevision: 0 });
    setTitle("");
  }

  return <div className="app-page life-page"><PageHeader eyebrow="Общий блокнот" title="Заметки и файлы" description="Рецепты, планы и документы — в одной библиотеке" action={<WButton size="sm" variant="secondary" onClick={() => navigate("/more")}>Назад</WButton>} /><div className="screen-padding notes-toolbar"><input aria-label="Поиск заметок" value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск по заметкам" /></div><div className="filter-row screen-padding">{folders.map(item => <WChip key={item} active={folder === item} onClick={() => setFolder(item)}>{item}</WChip>)}</div><div className="screen-padding stack">{visible.map(record => <button type="button" className="note-row" key={record.id} onClick={() => setSelectedId(record.id)}><WCard tone="lilac"><div className="w-mono-caps">{String(record.data.folder ?? "Общее")} · {record.data.tags ? (record.data.tags as string[]).join(" · ") : "без тегов"}</div><div className="life-title">{String(record.data.title)}</div><p>{noteText(record.data.content)}</p><small>Обновлено сегодня · {record.createdBy === "local-preview" ? "общая заметка" : "синхронизировано"}</small></WCard></button>)}{visible.length === 0 && <WCard tone="cream"><div className="life-title">Пока ничего не найдено</div><p>Создайте первую общую заметку или измените фильтр.</p></WCard>}<WCard tone="cream" className="life-form"><div className="w-mono-caps">Новая заметка</div><input aria-label="Название заметки" value={title} onChange={event => setTitle(event.target.value)} onKeyDown={event => { if (event.key === "Enter") addNote(); }} placeholder="Например, рецепт пасты" /><WButton size="sm" disabled={!title.trim() || busy} onClick={addNote}>Сохранить</WButton></WCard>{selected && <WCard tone="paper" className="note-preview"><div className="w-mono-caps">Просмотр заметки</div><div className="w-serif note-preview__title">{String(selected.data.title)}</div><p>{noteText(selected.data.content)}</p><WButton size="sm" variant="secondary" onClick={() => setSelectedId(null)}>Закрыть</WButton></WCard>}</div></div>;
}
