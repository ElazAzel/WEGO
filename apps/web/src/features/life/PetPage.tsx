import { WCard } from "@wego/ui";
import { PageHeader } from "../../components/layout/PageHeader";
import { useAppStore } from "../../store/use-app-store";
import { LivingRoomScene } from "../world/LivingRoomScene";
import { GameHud } from "../world/GameHud";

export function PetPage() {
  const space = useAppStore(state => state.space); const world = useAppStore(state => state.world);
  if (!space) return null;
  const moodCopy = { sleepy: "Сонный и уютный", cozy: "Тихий и заботливый", curious: "Любопытный и внимательный", playful: "Игривый и энергичный", loved: "Довольный вашей заботой" } as const;
  return <div className="app-page life-page"><PageHeader eyebrow="Общий питомец" title="Наш Вего" backTo="/more" description="Он растёт от заботы, игр и маленьких совместных ритуалов" /><div className="screen-padding"><LivingRoomScene room={space.room} style={space.style} stage={space.stage} daysAlive={space.daysAlive} character={space.character} /></div><div className="screen-padding"><GameHud /></div><div className="screen-padding"><WCard tone="yellow"><div className="w-mono-caps">Характер сегодня</div><div className="w-serif pet-page__mood">{moodCopy[world.mood]}</div><p>Пропуск не обнуляет развитие: Вего просто дождётся вас.</p></WCard></div></div>;
}
