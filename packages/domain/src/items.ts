import type { CatalogItem, CatalogItemKind } from "./economy";
import type { RoomSlot } from "./room-state";

export type ItemKind = CatalogItemKind | "accessory";
export type ItemSlot = RoomSlot | "outfit" | "accessory" | "emotion" | null;
export type ItemBehavior = "room-layer" | "wego-outfit" | "wego-accessory" | "wego-emotion" | "collection-only";
export type EquipTarget = { type: "room"; slot: RoomSlot } | { type: "wego"; slot: "outfit" | "accessory" | "emotion" };

export interface CosmeticCatalogItem extends Omit<CatalogItem, "kind"> {
  kind: ItemKind;
  assetId: string;
  slot: ItemSlot;
  behavior: ItemBehavior;
}

export const itemCatalog: readonly CosmeticCatalogItem[] = [
  { id: "soft-blanket", title: "Мягкий плед", description: "Вего будет сворачиваться на диване.", kind: "room", sparkPrice: 110, starsPrice: null, accent: "coral", entitlement: "space", assetId: "soft-blanket", slot: "sofa", behavior: "room-layer" },
  { id: "tea-set-berry", title: "Ягодный сервиз", description: "Чайник и две чашки для маленьких пауз.", kind: "room", sparkPrice: 80, starsPrice: 60, accent: "coral", entitlement: "space", assetId: "tea-set", slot: "table", behavior: "room-layer" },
  { id: "lamp-paper", title: "Бумажный абажур", description: "Мягкий свет для спокойных вечеров.", kind: "room", sparkPrice: 75, starsPrice: 55, accent: "yellow", entitlement: "space", assetId: "lamp-coral", slot: "lamp", behavior: "room-layer" },
  { id: "sticker-pack-cozy", title: "Набор «Рядом»", description: "Три тёплые эмоции для ваших сообщений.", kind: "sticker", sparkPrice: 55, starsPrice: 25, accent: "lilac", entitlement: "personal", assetId: "sticker-pack-cozy", slot: null, behavior: "collection-only" },
  { id: "rainy-window", title: "Окно с дождём", description: "Новый вечерний фон и тихая анимация.", kind: "room", sparkPrice: 320, starsPrice: 180, accent: "mint", entitlement: "space", assetId: "rainy-window", slot: "wall", behavior: "room-layer" },
  { id: "room-theme-autumn", title: "Тема «Осеннее окно»", description: "Другой ритм комнаты, без игрового преимущества.", kind: "room", sparkPrice: null, starsPrice: 280, accent: "mint", entitlement: "space", assetId: "room-theme-autumn", slot: "wall", behavior: "room-layer" },
  { id: "sunny-scarf", title: "Солнечный шарфик", description: "Маленький образ для прогулок.", kind: "outfit", sparkPrice: 90, starsPrice: 50, accent: "yellow", entitlement: "personal", assetId: "sunny-scarf", slot: "outfit", behavior: "wego-outfit" },
  { id: "night-hoodie", title: "Ночной худи", description: "Когда хочется тишины.", kind: "outfit", sparkPrice: 65, starsPrice: null, accent: "lilac", entitlement: "personal", assetId: "night-hoodie", slot: "outfit", behavior: "wego-outfit" },
  { id: "heart-bubble-effect", title: "Пузырь-обнимашка", description: "Маленькая эмоция для комнаты и сообщений.", kind: "emotion", sparkPrice: 20, starsPrice: 15, accent: "coral", entitlement: "personal", assetId: "heart-bubble-effect", slot: "emotion", behavior: "wego-emotion" },
  { id: "sunny-pin", title: "Солнечная заколка", description: "Тёплая деталь для образа Вего.", kind: "accessory", sparkPrice: 35, starsPrice: 20, accent: "yellow", entitlement: "personal", assetId: "sunny-pin", slot: "accessory", behavior: "wego-accessory" },
  { id: "memory-card-gold", title: "Золотая карточка памяти", description: "Тёплый стиль для одного особенного момента.", kind: "interaction", sparkPrice: 60, starsPrice: null, accent: "yellow", entitlement: "personal", assetId: "memory-card-gold", slot: null, behavior: "collection-only" },
  { id: "minigame-pack-dates", title: "Набор игр «Свидания»", description: "Три новых повода выбрать друг друга.", kind: "minigame_pack", sparkPrice: 220, starsPrice: null, accent: "lilac", entitlement: "space", assetId: "minigame-pack-dates", slot: null, behavior: "collection-only" },
  { id: "wego-anim-dance", title: "Танец Вего", description: "Косметическая анимация радости.", kind: "animation", sparkPrice: null, starsPrice: 450, accent: "yellow", entitlement: "personal", assetId: "wego-anim-dance", slot: null, behavior: "collection-only" },
  { id: "fairy-lights-neon", title: "Гирлянда «После полуночи»", description: "Только визуальный свет для ночного вайба комнаты.", kind: "room", sparkPrice: 140, starsPrice: 90, accent: "yellow", entitlement: "space", assetId: "fairy-lights", slot: "wall", behavior: "room-layer" },
  { id: "vinyl-speaker-cozy", title: "Виниловая колонка", description: "Только визуальный предмет для ваших маленьких вечеринок.", kind: "room", sparkPrice: 120, starsPrice: 80, accent: "mint", entitlement: "space", assetId: "speaker-vinyl", slot: "shelf", behavior: "room-layer" },
  { id: "memory-wall-soft", title: "Мягкая стена памяти", description: "Только визуальная рамка для любимых общих моментов.", kind: "room", sparkPrice: 180, starsPrice: 120, accent: "coral", entitlement: "space", assetId: "memory-wall", slot: "wall", behavior: "room-layer" },
  { id: "note-board-stickers", title: "Доска стикеров", description: "Только визуальная доска для тёплых знаков партнёру.", kind: "room", sparkPrice: 95, starsPrice: null, accent: "lilac", entitlement: "space", assetId: "note-board", slot: "shelf", behavior: "room-layer" },
  { id: "candle-night", title: "Свеча «Тихий вечер»", description: "Только визуальный огонёк для лампового настроения.", kind: "room", sparkPrice: 70, starsPrice: 45, accent: "yellow", entitlement: "space", assetId: "candle-glow", slot: "table", behavior: "room-layer" },
  { id: "mirror-mint", title: "Мятное зеркало", description: "Только визуальная деталь для примерки образов Вего.", kind: "room", sparkPrice: 110, starsPrice: 65, accent: "mint", entitlement: "space", assetId: "mirror-cozy", slot: "wall", behavior: "room-layer" },
  { id: "daily-gift-skin", title: "Коробка сюрпризов", description: "Только визуальная оболочка для ежедневной капсулы.", kind: "interaction", sparkPrice: 60, starsPrice: 35, accent: "coral", entitlement: "personal", assetId: "gift-box", slot: null, behavior: "collection-only" },
];

export function getCatalogItem(itemId: string): CosmeticCatalogItem | undefined {
  return itemCatalog.find((item) => item.id === itemId);
}

export function canEquipItem(itemId: string, target: EquipTarget): boolean {
  const item = getCatalogItem(itemId);
  if (!item || !item.slot) return false;
  return target.type === "room" ? item.behavior === "room-layer" && item.slot === target.slot : item.slot === target.slot && item.behavior.startsWith("wego-");
}

export function isCosmeticItem(itemId: string): boolean {
  const item = getCatalogItem(itemId);
  return Boolean(item && ["room", "outfit", "accessory", "emotion", "animation"].includes(item.kind));
}
