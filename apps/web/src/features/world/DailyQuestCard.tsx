import { WButton, WCard } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";

export function DailyQuestCard() {
  const quest = useAppStore((state) => state.world.cozy.dailyQuest);
  const claimDailyQuest = useAppStore((state) => state.claimDailyQuest);
  const claimed = quest.status === "claimed";
  return <WCard tone={claimed ? "mint" : "yellow"} className="daily-quest" data-status={quest.status}>
    <div><div className="w-mono-caps">Капсула дня</div><div className="w-serif">{quest.title}</div><p>{claimed ? "Уже в твоей коллекции — возвращайся завтра за новым маленьким жестом." : quest.description}</p></div>
    {claimed ? <span className="unlock-badge">Готово</span> : <WButton size="sm" variant="secondary" onClick={claimDailyQuest}>Забрать +{quest.reward} ✦</WButton>}
  </WCard>;
}
