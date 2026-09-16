import { WCard } from "@wego/ui";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useAppStore } from "../../store/use-app-store";
const modules = [["notes", "Заметки и файлы", "Рецепты, документы и списки в общей библиотеке", "lilac"], ["cards", "Карты лояльности", "Штрихкод на весь экран, доступный офлайн", "peach"], ["history", "Близость и история", "Вопросы дня, капсулы и альбом воспоминаний", "mint"], ["pet", "Наш питомец", "Уход, игры и характер общего друга", "yellow"]] as const;
const paths: Record<(typeof modules)[number][0], string> = { notes: "/notes", cards: "/cards", history: "/history", pet: "/pet" };

export function MorePage() {
  const space = useAppStore(s => s.space);
  const navigate = useNavigate();
  return <div className="app-page life-page"><PageHeader eyebrow="Ещё" title="Всё общее" description="Дополнительные комнаты WEGO подключаются к тому же пространству" /><div className="screen-padding stack">{modules.map(([id, title, description, tone]) => <button key={id} type="button" className="more-module" onClick={() => navigate(paths[id])} aria-label={`${title}. Открыть` }><WCard tone={tone}><div className="w-mono-caps">{id === "pet" ? "ПИТОМЕЦ" : "МОДУЛЬ"}</div><div className="life-title">{title}</div><p>{description}</p><span className="w-chip w-chip--paper">Открыть →</span></WCard></button>)}<button type="button" className="more-module" onClick={() => navigate("/notifications")} aria-label="Уведомления. Открыть"><WCard tone="paper"><div className="w-mono-caps">СИНХРОНИЗАЦИЯ</div><div className="life-title">Уведомления</div><p>Центр событий, Telegram, тихие часы и скрытие текста на экране блокировки.</p><span className="w-chip w-chip--paper">Открыть →</span></WCard></button><WCard tone="cream"><div className="w-mono-caps">Приватность пары</div><p>Личные подключения календарей и закрытые ответы не попадают в питомца, рекламу или внешние события.</p><small>{space ? `Пространство: ${space.name}` : "Локальный preview"}</small></WCard></div></div>;
}
