import { Icon, type IconName } from "./Icon";

export type TabId = "wego" | "we" | "together" | "story";
const tabs: ReadonlyArray<{ id: TabId; label: string; icon: IconName }> = [
  { id: "wego", label: "Wego", icon: "wego" }, { id: "we", label: "Мы", icon: "we" }, { id: "together", label: "Вместе", icon: "together" }, { id: "story", label: "Story", icon: "story" },
];

export function WTabBar({ current, onChange }: { current: TabId; onChange: (tab: TabId) => void }) {
  return <nav className="w-tabbar" aria-label="Основная навигация"><div role="tablist">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={current === tab.id} className={current === tab.id ? "is-active" : ""} onClick={() => onChange(tab.id)}><Icon name={tab.icon} /><span>{tab.label}</span></button>)}</div></nav>;
}
