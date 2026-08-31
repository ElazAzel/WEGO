import { roomVibes, type RoomVibe } from "@wego/domain";
import { BottomSheet, WButton } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const labels: Record<RoomVibe, string> = {
  "slow-morning": "Медленное утро",
  "rainy-date": "Дождливое свидание",
  "study-buddy": "Учимся вместе",
  "night-cozy": "Ночная ламповая",
  "tiny-party": "Маленькая вечеринка",
};

export function PairGameSheet() {
  const open = useUiStore((state) => state.sheet === "games");
  const close = useUiStore((state) => state.closeSheet);
  const game = useAppStore((state) => state.world.cozy.game);
  const answerChooseVibe = useAppStore((state) => state.answerChooseVibe);
  const answerPartnerChooseVibe = useAppStore((state) => state.answerPartnerChooseVibe);
  const completed = game?.status === "completed";

  return <BottomSheet open={open} onClose={close} title="Вместе">
    <div className="mini-game-card mini-game-card--cozy">
      <div className="w-mono-caps">Игра для двоих</div>
      {completed ? <><div className="w-serif mini-game-card__done">{game.result === "match" ? "Вы поймали один вайб ✦" : "Два вайба рядом"}</div><p className="muted-copy">{game.result === "match" ? "Вего уже сохранил этот момент в общую память." : "Ваши ответы разные — и это тоже часть вашей истории."}</p><WButton variant="mint" onClick={close}>Сохранить момент</WButton></> : game?.status === "waiting" ? <><div className="w-serif mini-game-card__title">Ждём выбор партнёра</div><p className="muted-copy">Ты выбрал(а) «{labels[game.myAnswer ?? "slow-morning"]}». Когда партнёр ответит, Вего откроет результат.</p>{import.meta.env.DEV && <div className="mini-game-preview"><div className="w-mono-caps">Локальный preview</div><p>Ответ партнёра:</p><div className="mini-game-answers">{roomVibes.map((vibe) => <button key={vibe} type="button" onClick={() => answerPartnerChooseVibe(vibe)}>{labels[vibe]}</button>)}</div></div>}</> : <><div className="w-serif mini-game-card__title">Какой вайб подарить этому вечеру?</div><p className="muted-copy">Ответы скрыты, пока вы оба не выберете настроение.</p><div className="mini-game-answers">{roomVibes.map((vibe) => <button key={vibe} type="button" onClick={() => answerChooseVibe(vibe)}>{labels[vibe]}</button>)}</div></>}
    </div>
  </BottomSheet>;
}
