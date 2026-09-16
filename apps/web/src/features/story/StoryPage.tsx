import { WButton, WCard } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { EmptyStoryState } from "../../components/layout/States";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const typeLabels: Record<string, string> = { evolution: "Эволюция", result: "Результат", activity: "Активность", note: "Записка", reveal: "Reveal" };
export function StoryPage() {
  const story = useAppStore((state) => state.story); const openShare = useUiStore((state) => state.openShare); const openCheckin = useUiStore((state) => state.openSheet);
  return <div className="app-page"><PageHeader eyebrow="История" title="Ваша история" backTo="/more" description={`${story.length} ${story.length === 1 ? "момент" : "моментов"} вашей комнаты`} />{story.length === 0 ? <EmptyStoryState onCheckIn={() => openCheckin("checkin")} /> : <div className="story-list">{story.map((entry, index) => <WCard key={entry.id} tone={entry.tone === "peach" ? "peach" : entry.tone} className="story-item"><div className="story-meta w-mono-caps"><span>{typeLabels[entry.type] ?? entry.type}</span><span>{entry.date}{index === 0 && " · Новое"}</span></div><div className="w-serif story-title">{entry.title}</div><p>{entry.body}</p><WButton variant="secondary" size="sm" onClick={() => openShare(entry.id)}>Поделиться</WButton></WCard>)}</div>}</div>;
}
