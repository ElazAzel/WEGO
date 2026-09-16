import { NeedMeter, SparkBalance } from "@wego/ui";
import { useUiStore } from "../../store/use-ui-store";
import { useAppStore } from "../../store/use-app-store";
import { DailyQuestCard } from "./DailyQuestCard";

const needs: Array<{ id: keyof ReturnType<typeof useAppStore.getState>["world"]["needs"]; label: string }> = [
  { id: "hunger", label: "Сытость" }, { id: "energy", label: "Силы" }, { id: "joy", label: "Радость" }, { id: "connection", label: "Связь" },
];

export function GameHud() {
  const wallet = useAppStore((state) => state.economy.wallet);
  const world = useAppStore((state) => state.world);
  const partnerHere = useAppStore((state) => Boolean(state.today.partnerMood));
  const openSheet = useUiStore((state) => state.openSheet);
  return <section className="game-hud" aria-label="Состояние Вего">
    <div className="game-hud__top"><SparkBalance balance={wallet.balance} /><div className="game-hud__actions"><button type="button" className="hud-action" onClick={() => openSheet("vibes")}><span aria-hidden="true">☼</span><small>Вайб</small></button><button type="button" className="hud-action" onClick={() => openSheet("rituals")}><span aria-hidden="true">♡</span><small>Ритуал</small></button><button type="button" className="hud-action" onClick={() => openSheet("wardrobe")}><span aria-hidden="true">◌</span><small>Образ</small></button><button type="button" className="hud-action" onClick={() => openSheet("shop")}><span aria-hidden="true">⌂</span><small>Лавка</small></button><button type="button" className="hud-action" onClick={() => openSheet("plans")}><span aria-hidden="true">☼</span><small>Планы</small></button><button type="button" className="hud-action" onClick={() => openSheet("games")}><span aria-hidden="true">✳</span><small>Играть</small></button></div></div>
    <div className="need-strip">{needs.map((need) => <NeedMeter key={need.id} label={need.label} value={world.needs[need.id]} />)}</div>
    <p className="game-hud__hint"><strong>Уровень {world.level}</strong> · {world.affection} тепла · серия {world.interactionStreak} дн.</p>
    <p className="game-hud__equipment" aria-label="Текущая экипировка"><span>На Вего: {world.equippedWegoItems.outfit === "everyday" ? "каждый день" : world.equippedWegoItems.outfit}</span>{world.equippedWegoItems.accessory && <span>✦ {world.equippedWegoItems.accessory}</span>}{world.equippedRoomItems.wall && <span>⌂ {world.equippedRoomItems.wall}</span>}</p>
    <p className="game-hud__presence" role="status">{partnerHere ? "Вы оба уже здесь сегодня" : "Ждём вас обоих сегодня"}</p>
    <DailyQuestCard />
  </section>;
}
