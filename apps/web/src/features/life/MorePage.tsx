import { WCard } from "@wego/ui";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { useAppStore } from "../../store/use-app-store";

const modules = [
  ["notes", "Заметки и файлы", "Рецепты, документы и списки в общей библиотеке", "lilac", "/notes"],
  ["cards", "Карты лояльности", "Штрихкод на весь экран, доступный офлайн", "peach", "/cards"],
  ["history", "Близость и история", "Вопросы дня, капсулы и альбом воспоминаний", "mint", "/history"],
  ["pet", "Наш питомец", "Уход, игры и характер общего друга", "yellow", "/pet"],
  ["together", "Идеи для двоих", "Небольшие активности, которые превращаются в воспоминания", "coral", "/together"],
  ["we", "Узнавать друг друга", "Вопросы и выборы с ответами, скрытыми до момента Reveal", "lilac", "/we"],
  ["story", "Ваша история", "Все сохранённые Reveal и моменты вашей комнаты", "mint", "/story"],
  ["notifications", "Уведомления", "События, Telegram, тихие часы и приватность текста", "paper", "/notifications"],
] as const;

export function MorePage() {
  const space = useAppStore(s => s.space);
  const navigate = useNavigate();
  return <div className="app-page life-page"><PageHeader eyebrow="Ещё" title="Всё общее" description="Все дополнительные комнаты WEGO — в одном спокойном меню" /><div className="screen-padding more-intro"><WCard tone="cream"><div className="w-mono-caps">Ваше пространство</div><div className="more-intro__name">{space?.name ?? "Общая комната"}</div><p>Выберите раздел. Всё, что вы добавляете здесь, принадлежит вашей комнате и синхронизируется с партнёром.</p><button type="button" className="more-account-link" onClick={() => navigate("/settings")}>Аккаунт и приглашение <span aria-hidden="true">→</span></button></WCard></div><div className="screen-padding more-grid">{modules.map(([id, title, description, tone, path]) => <button key={id} type="button" className="more-module" onClick={() => navigate(path)} aria-label={`${title}. Открыть`}><WCard tone={tone}><div className="more-module__top"><div className="w-mono-caps">{id === "pet" ? "ПИТОМЕЦ" : id === "notifications" ? "СИНХРОНИЗАЦИЯ" : "МОДУЛЬ"}</div><span aria-hidden="true">↗</span></div><div className="life-title">{title}</div><p>{description}</p><span className="w-chip w-chip--paper">Открыть</span></WCard></button>)}</div><div className="screen-padding"><WCard tone="paper" className="privacy-card"><div className="w-mono-caps">Приватность пары</div><p>Личные подключения календарей и закрытые ответы не попадают в питомца, рекламу или внешние события.</p><small>{space ? `Пространство: ${space.name}` : "Ожидаем вход через Telegram"}</small></WCard></div></div>;
}
