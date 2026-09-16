import { useEffect, useMemo, useState } from "react";
import { WButton, WCard, WChip } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { apiFetch, isApiEnabled } from "../../lib/api-client";
import { useNavigate } from "react-router-dom";

type Category = "task" | "calendar" | "partner" | "pet" | "system";
type Notice = { id: string; category: Category; title: string; body: string; createdAt: string; readAt: string | null; deepLink?: string };
type Preferences = { enabled: boolean; telegram: boolean; webPush: boolean; hidePreview: boolean; quietFrom: string; quietTo: string; timezone: string; categories: Record<Category, boolean> };

const preview: Notice[] = [
  { id: "preview-anniversary", category: "calendar", title: "Скоро ваша годовщина", body: "Наша годовщина · через 28 дней", createdAt: "2026-09-15T09:00:00.000Z", readAt: null, deepLink: "/calendar" },
  { id: "preview-task", category: "task", title: "У партнёра есть задача", body: "Забронировать ужин · до 21 сентября", createdAt: "2026-09-15T08:00:00.000Z", readAt: null, deepLink: "/tasks" },
  { id: "preview-pet", category: "pet", title: "Вего ждёт вас", body: "Сегодня питомец получил новый маленький ритуал", createdAt: "2026-09-14T18:00:00.000Z", readAt: new Date().toISOString(), deepLink: "/pet" },
];

const defaultPreferences: Preferences = { enabled: true, telegram: true, webPush: false, hidePreview: false, quietFrom: "23:00", quietTo: "08:00", timezone: "Asia/Almaty", categories: { task: true, calendar: true, partner: true, pet: true, system: true } };

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState(preview);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [filter, setFilter] = useState<"all" | Category>("all");
  useEffect(() => {
    if (!isApiEnabled()) return;
    void Promise.all([apiFetch<{ notifications: Notice[] }>("/notifications"), apiFetch<{ preferences: Preferences }>("/notifications/preferences")]).then(([notificationResult, preferenceResult]) => { setItems(remote => mergeNotices(notificationResult.notifications, remote)); setPreferences(current => ({ ...current, ...preferenceResult.preferences, categories: { ...current.categories, ...preferenceResult.preferences.categories } })); }).catch(() => undefined);
  }, []);
  const visible = useMemo(() => items.filter(item => filter === "all" || item.category === filter), [filter, items]);
  const unread = items.filter(item => !item.readAt).length;
  const markRead = (item: Notice) => { setItems(current => current.map(value => value.id === item.id ? { ...value, readAt: value.readAt ?? new Date().toISOString() } : value)); if (isApiEnabled() && !item.readAt) void apiFetch(`/notifications/${item.id}/read`, { method: "POST" }).catch(() => undefined); if (item.deepLink) navigate(item.deepLink); };
  const updatePreference = (patch: Partial<Preferences>) => { const next = { ...preferences, ...patch }; setPreferences(next); if (isApiEnabled()) void apiFetch("/notifications/preferences", { method: "PUT", body: JSON.stringify(patch) }).catch(() => undefined); };
  return <div className="app-page life-page"><PageHeader eyebrow="Синхронизация" title="Уведомления" description="Центр событий WEGO и настройки внешних каналов" action={<WButton size="sm" variant="secondary" onClick={() => navigate("/more")}>Назад</WButton>} /><div className="screen-padding"><WCard tone="lilac" className="notification-summary"><div><div className="w-mono-caps">В центре</div><div className="notification-count">{unread}</div><small>непрочитанных</small></div><div className="notification-summary__state">{preferences.enabled ? "Уведомления включены" : "Уведомления выключены"}<br /><span>{preferences.telegram ? "Telegram подключён" : "Только внутри WEGO"}</span></div></WCard></div><div className="filter-row screen-padding"><WChip active={filter === "all"} onClick={() => setFilter("all")}>Все · {items.length}</WChip>{(["task", "calendar", "partner", "pet"] as const).map(category => <WChip key={category} active={filter === category} onClick={() => setFilter(category)}>{categoryLabel(category)}</WChip>)}</div><div className="screen-padding stack">{visible.map(item => <button type="button" key={item.id} className={`notification-row ${item.readAt ? "is-read" : ""}`} onClick={() => markRead(item)}><WCard tone={item.readAt ? "paper" : "peach"}><div className="notification-row__top"><span className="w-mono-caps">{categoryLabel(item.category)}</span><span>{item.readAt ? "прочитано" : "новое"}</span></div><div className="life-title">{item.title}</div><p>{item.body}</p></WCard></button>)}{visible.length === 0 && <WCard tone="cream"><div className="life-title">Пусто</div><p>Для этого раздела пока нет уведомлений.</p></WCard>}<WCard tone="cream" className="notification-settings"><div className="w-mono-caps">Каналы и приватность</div><label><span>Получать уведомления</span><input type="checkbox" checked={preferences.enabled} onChange={event => updatePreference({ enabled: event.target.checked })} /></label><label><span>Telegram</span><input type="checkbox" checked={preferences.telegram} onChange={event => updatePreference({ telegram: event.target.checked })} /></label><label><span>Скрывать текст на экране блокировки</span><input type="checkbox" checked={preferences.hidePreview} onChange={event => updatePreference({ hidePreview: event.target.checked })} /></label><small>Тихие часы: {preferences.quietFrom}–{preferences.quietTo} · {preferences.timezone}</small></WCard></div></div>;
}

function mergeNotices(remote: Notice[], fallback: Notice[]) { const ids = new Set(remote.map(item => item.id)); return [...remote, ...fallback.filter(item => !ids.has(item.id))]; }
function categoryLabel(category: Category) { return ({ task: "Дела", calendar: "Календарь", partner: "Партнёр", pet: "Питомец", system: "Система" })[category]; }
