import { Icon, type IconName } from "./Icon";

export type TabId = "wego" | "we" | "together" | "story" | "calendar" | "tasks" | "plans";
const tabs: ReadonlyArray<{ id: TabId; label: string; ariaLabel: string; icon: IconName }> = [
  { id: "wego", label: "Мы", ariaLabel: "Wego", icon: "wego" }, { id: "calendar", label: "Календарь", ariaLabel: "Календарь", icon: "calendar" }, { id: "tasks", label: "Дела", ariaLabel: "Дела", icon: "tasks" }, { id: "plans", label: "Планы", ariaLabel: "Планы", icon: "plans" }, { id: "story", label: "Ещё", ariaLabel: "Story", icon: "more" },
];

export function WTabBar({ current, onChange }: { current: TabId; onChange: (tab: TabId) => void }) {
  return <nav className="w-tabbar" aria-label="Основная навигация"><div role="tablist">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-label={tab.ariaLabel} aria-selected={current === tab.id} className={current === tab.id ? "is-active" : ""} onClick={() => onChange(tab.id)}><Icon name={tab.icon} /><span>{tab.label}</span></button>)}</div></nav>;
}
