import { WCard } from "@wego/ui";
import { BottomSheet } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

export function MemoryWall({ compact }: { compact: boolean }) {
  const memories = useAppStore((state) => state.world.memories);
  const pinnedIds = useAppStore((state) => state.world.cozy.memoryWall);
  const pinMemory = useAppStore((state) => state.pinMemory);
  const visible = compact ? pinnedIds.map((id) => memories.find((memory) => memory.id === id)).filter((memory): memory is NonNullable<typeof memory> => Boolean(memory)).slice(0, 3) : memories.slice(0, 12);
  if (compact && !visible.length) return null;
  return <section className={`memory-wall ${compact ? "memory-wall--compact" : ""}`} aria-label="Общая память">
    {!compact && <><div className="w-mono-caps">Общая память</div><div className="w-serif memory-wall__title">Стена маленьких моментов</div></>}
    <div className="memory-wall__cards">{visible.map((memory) => {
      const pinned = pinnedIds.includes(memory.id);
      return <WCard key={memory.id} tone={memory.tone} className={`memory-polaroid ${pinned ? "is-pinned" : ""}`}><small>{new Date(memory.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</small><strong className="w-serif">{memory.title}</strong>{!compact && <p>{memory.body}</p>}<button type="button" className="memory-polaroid__pin" onClick={() => pinMemory(memory.id)} aria-label={`${pinned ? "Убрать" : "Закрепить"} ${memory.title}`}>{pinned ? "Закреплено в комнате" : "Закрепить в комнате"}</button></WCard>;
    })}</div>
  </section>;
}

export function MemoryWallSheet() {
  const open = useUiStore((state) => state.sheet === "memories");
  const close = useUiStore((state) => state.closeSheet);
  return <BottomSheet open={open} onClose={close} title="Общая память"><p className="muted-copy">Закрепляйте моменты, которые хочется видеть в комнате каждый день.</p><MemoryWall compact={false} /></BottomSheet>;
}
