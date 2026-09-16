import { itemCatalog } from "@wego/domain";
import { BottomSheet, WButton, WCard } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";

const everyday = { id: "everyday", title: "На каждый день", description: "Мягкий и спокойный базовый образ", accent: "mint" as const, slot: "outfit" as const };

export function WardrobeSheet() {
  const open = useUiStore((state) => state.sheet === "wardrobe");
  const close = useUiStore((state) => state.closeSheet);
  const world = useAppStore((state) => state.world);
  const unlockWithSparks = useAppStore((state) => state.unlockWithSparks);
  const equipWegoItem = useAppStore((state) => state.equipWegoItem);
  const unequipWegoItem = useAppStore((state) => state.unequipWegoItem);
  const items = itemCatalog.filter((item) => item.behavior.startsWith("wego-"));

  function equip(itemId: string, price: number) {
    if (!world.unlockedItemIds.includes(itemId) && !unlockWithSparks(itemId, price)) return;
    equipWegoItem(itemId);
  }

  const renderItem = (item: typeof everyday | (typeof items)[number]) => {
    const unlocked = world.unlockedItemIds.includes(item.id);
    const active = item.slot === "outfit" ? world.equippedWegoItems.outfit === item.id : item.slot === "accessory" ? world.equippedWegoItems.accessory === item.id : world.equippedWegoItems.emotion === item.id;
    const price = "sparkPrice" in item ? item.sparkPrice : 0;
    return <WCard key={item.id} tone={item.accent} className={`wardrobe-item ${active ? "is-active" : ""}`}><div className="wardrobe-item__icon" aria-hidden="true">{item.slot === "emotion" ? "♡" : item.slot === "accessory" ? "✦" : "◌"}</div><div className="w-serif wardrobe-item__title">{item.title}</div><small>{item.description}</small>{active ? <>{<span className="unlock-badge">Надето</span>}{item.slot !== "outfit" && <WButton size="sm" variant="ghost" onClick={() => unequipWegoItem(item.slot as "accessory" | "emotion")}>Снять</WButton>}</> : unlocked ? <WButton size="sm" variant="secondary" onClick={() => equipWegoItem(item.id)}>Надеть</WButton> : price ? <WButton size="sm" variant="ghost" onClick={() => equip(item.id, price)}>✦ {price}</WButton> : <span className="muted-copy">Доступно позже</span>}</WCard>;
  };

  return <BottomSheet open={open} onClose={close} title="Гардероб"><p className="muted-copy">Образ, аксессуар и эмоция живут в коллекции Вего. Меняйте их без повторной покупки.</p><div className="wardrobe-grid">{renderItem(everyday)}{items.map(renderItem)}</div></BottomSheet>;
}
