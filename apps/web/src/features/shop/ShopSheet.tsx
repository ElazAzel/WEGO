import { useMemo, useState } from "react";
import { itemCatalog, type CosmeticCatalogItem } from "@wego/domain";
import { BottomSheet, WButton, WCard } from "@wego/ui";
import { useAppStore } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { isTelegram, openTelegramInvoice } from "../../lib/telegram";

type ShopFilter = "all" | "owned" | "room" | "wego" | "extras";
const filterLabels: Array<{ id: ShopFilter; label: string }> = [{ id: "all", label: "Все" }, { id: "owned", label: "Мои" }, { id: "room", label: "Комната" }, { id: "wego", label: "Вего" }, { id: "extras", label: "Память" }];

function iconFor(item: CosmeticCatalogItem): string { if (item.kind === "outfit") return "◌"; if (item.kind === "emotion" || item.kind === "sticker") return "♡"; if (item.kind === "room") return item.id.includes("window") ? "☂" : "⌂"; if (item.kind === "animation") return "✳"; return "▱"; }
function matchesFilter(item: CosmeticCatalogItem, filter: ShopFilter, owned: boolean): boolean { if (filter === "owned") return owned; if (filter === "room") return item.behavior === "room-layer"; if (filter === "wego") return item.behavior.startsWith("wego-"); if (filter === "extras") return item.behavior === "collection-only"; return true; }

export function ShopSheet() {
  const open = useUiStore((state) => state.sheet === "shop");
  const close = useUiStore((state) => state.closeSheet);
  const world = useAppStore((state) => state.world);
  const unlocked = useAppStore((state) => state.world.unlockedItemIds);
  const partner = useAppStore((state) => state.partner);
  const unlockWithSparks = useAppStore((state) => state.unlockWithSparks);
  const equipRoomItem = useAppStore((state) => state.equipRoomItem);
  const unequipRoomItem = useAppStore((state) => state.unequipRoomItem);
  const equipWegoItem = useAppStore((state) => state.equipWegoItem);
  const unequipWegoItem = useAppStore((state) => state.unequipWegoItem);
  const [filter, setFilter] = useState<ShopFilter>("all");
  const [status, setStatus] = useState("");
  const items = useMemo(() => itemCatalog.filter((item) => matchesFilter(item, filter, unlocked.includes(item.id))), [filter, unlocked]);

  async function buyWithStars(itemId: string, stars: number, recipientUserId?: string) {
    if (!isTelegram()) { setStatus("Stars доступны только внутри Telegram."); return; }
    setStatus(recipientUserId ? "Открываем подарок…" : "Открываем оплату…");
    try {
      const paid = await openTelegramInvoice(itemId, stars, recipientUserId);
      setStatus(paid ? (recipientUserId ? "Подарок отправлен партнёру." : "Платёж принят, предмет появится после подтверждения.") : "Оплата не завершена.");
    } catch { setStatus("Не удалось открыть оплату. Попробуйте ещё раз."); }
  }

  function equip(item: CosmeticCatalogItem) {
    const success = item.behavior === "room-layer" && item.slot && !["outfit", "accessory", "emotion"].includes(item.slot) ? equipRoomItem(item.id) : equipWegoItem(item.id);
    setStatus(success ? `${item.title} теперь в сцене.` : "Этот предмет нельзя надеть в текущий слот.");
  }

  function isEquipped(item: CosmeticCatalogItem): boolean {
    if (item.behavior === "room-layer" && item.slot && !["outfit", "accessory", "emotion"].includes(item.slot)) return world.equippedRoomItems[item.slot as keyof typeof world.equippedRoomItems] === item.id;
    if (item.slot === "accessory" || item.slot === "emotion") return world.equippedWegoItems[item.slot] === item.id;
    return item.slot === "outfit" && world.equippedWegoItems.outfit === item.id;
  }

  function unequip(item: CosmeticCatalogItem) {
    if (item.behavior === "room-layer" && item.slot && !["outfit", "accessory", "emotion"].includes(item.slot)) unequipRoomItem(item.slot as keyof typeof world.equippedRoomItems);
    else if (item.slot === "accessory" || item.slot === "emotion") unequipWegoItem(item.slot);
    setStatus(`${item.title} снят.`);
  }

  return <BottomSheet open={open} onClose={close} title="Лавка Wego">
    <p className="muted-copy">Искры — внутриигровая забота. Stars — отдельный добровольный способ поддержать автора и подарить косметику партнёру.</p>
    <div className="shop-filter" role="tablist" aria-label="Разделы лавки">{filterLabels.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={`shop-filter__button ${filter === item.id ? "is-active" : ""}`} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    {status && <p className="shop-item__status" role="status">{status}</p>}
    <div className="shop-list">{items.map((item) => {
      const owned = unlocked.includes(item.id);
      const canEquip = item.behavior === "room-layer" || item.behavior.startsWith("wego-");
      const equipped = isEquipped(item);
      return <WCard key={item.id} tone={item.accent} className="shop-item">
        <div className="shop-item__art" aria-hidden="true">{iconFor(item)}</div>
        <div className="shop-item__copy">
          <div className="w-serif shop-item__title">{item.title}</div>
          <p>{item.description}</p>
          <div className="shop-item__actions">
            {owned && <span className="unlock-badge">{equipped ? (item.behavior === "room-layer" ? "Установлено" : "Надето") : "В коллекции"}</span>}
            {owned && canEquip && !equipped && <WButton size="sm" variant="secondary" onClick={() => equip(item)}>Надеть</WButton>}
            {owned && canEquip && equipped && item.slot !== "outfit" && <WButton size="sm" variant="ghost" onClick={() => unequip(item)}>Снять</WButton>}
            {!owned && item.sparkPrice && <WButton size="sm" variant="secondary" onClick={() => unlockWithSparks(item.id, item.sparkPrice!)}>✦ {item.sparkPrice}</WButton>}
            {item.starsPrice && <WButton size="sm" variant="ghost" onClick={() => void buyWithStars(item.id, item.starsPrice!)}>★ {item.starsPrice}</WButton>}
            {item.starsPrice && partner && <WButton size="sm" variant="ghost" onClick={() => void buyWithStars(item.id, item.starsPrice!, partner.id)}>Подарить</WButton>}
          </div>
        </div>
      </WCard>;
    })}</div>{!items.length && <p className="muted-copy shop-empty">Здесь пока пусто — загляните в другие разделы.</p>}
  </BottomSheet>;
}
