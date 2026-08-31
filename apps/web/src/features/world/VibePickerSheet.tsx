import { roomVibes, type RoomVibe } from "@wego/domain";
import { BottomSheet, WCard } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const vibeMeta: Record<RoomVibe, { title: string; description: string; tone: "yellow" | "mint" | "lilac" | "coral" }> = {
  "slow-morning": { title: "Медленное утро", description: "Свет, чай и очень мягкое начало.", tone: "yellow" },
  "rainy-date": { title: "Дождливое свидание", description: "Капли на окне и тишина рядом.", tone: "mint" },
  "study-buddy": { title: "Учимся вместе", description: "Лампа, заметки и поддержка.", tone: "coral" },
  "night-cozy": { title: "Ночная ламповая", description: "Гирлянда и маленькая пауза вдвоём.", tone: "lilac" },
  "tiny-party": { title: "Маленькая вечеринка", description: "Танец, искры и чуть больше радости.", tone: "coral" },
};

export function vibeTitle(vibe: RoomVibe): string {
  return vibeMeta[vibe].title;
}

export function VibePickerSheet() {
  const open = useUiStore((state) => state.sheet === "vibes");
  const close = useUiStore((state) => state.closeSheet);
  const current = useAppStore((state) => state.world.cozy.vibe);
  const setRoomVibe = useAppStore((state) => state.setRoomVibe);
  return <BottomSheet open={open} onClose={close} title="Вайб комнаты">
    <p className="muted-copy">Один тап меняет свет, настроение Вего и маленькие детали комнаты.</p>
    <div className="vibe-picker">{roomVibes.map((vibe) => {
      const meta = vibeMeta[vibe];
      return <button key={vibe} type="button" className={`vibe-option ${current === vibe ? "is-active" : ""}`} aria-pressed={current === vibe} onClick={() => setRoomVibe(vibe)}>
        <WCard tone={meta.tone}><span className="w-mono-caps">{current === vibe ? "Сейчас" : "Выбрать"}</span><span className="w-serif">{meta.title}</span><small>{meta.description}</small></WCard>
      </button>;
    })}</div>
  </BottomSheet>;
}
