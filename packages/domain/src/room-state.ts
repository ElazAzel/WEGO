export const roomSlots = ["sofa", "rug", "lamp", "table", "shelf", "plants", "wall"] as const;
export type RoomSlot = (typeof roomSlots)[number];

export type LampState = "on" | "off";
export type CurtainsState = "open" | "closed";
export type TableState = "empty" | "tea-ready";
export type PlantsState = "healthy" | "needs-care";
export type WindowState = "quiet" | "rainy";

export interface RoomEnvironmentState {
  lamp: LampState;
  curtains: CurtainsState;
  table: TableState;
  plants: PlantsState;
  window: WindowState;
}

export type RoomEnvironmentObjectId = "lamp" | "window" | "table" | "plant";

export type RoomInteraction =
  | { objectId: "lamp"; interaction: "toggle" }
  | { objectId: "window"; interaction: "toggle-curtains" }
  | { objectId: "table"; interaction: "serve-tea" | "collect-tea" }
  | { objectId: "plant"; interaction: "water" };

export type EquippedRoomItems = Record<RoomSlot, string | null>;

export interface EquippedWegoItems {
  outfit: string;
  accessory: string | null;
  emotion: string | null;
}

export interface NormalizedRoomState {
  environment: RoomEnvironmentState;
  equippedRoomItems: EquippedRoomItems;
  equippedWegoItems: EquippedWegoItems;
  unlockedItemIds: string[];
  outfitId: string;
}

interface UnknownRecord {
  [key: string]: unknown;
}

const defaultEnvironment: RoomEnvironmentState = { lamp: "on", curtains: "open", table: "empty", plants: "healthy", window: "quiet" };

export function defaultRoomEnvironment(): RoomEnvironmentState {
  return { ...defaultEnvironment };
}

export function defaultEquippedRoomItems(): EquippedRoomItems {
  return { sofa: null, rug: null, lamp: null, table: null, shelf: null, plants: null, wall: null };
}

export function defaultEquippedWegoItems(outfit = "everyday"): EquippedWegoItems {
  return { outfit, accessory: null, emotion: null };
}

function recordOf(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function enumValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === "string" && values.includes(value as T) ? value as T : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizedOwnedItems(value: unknown, outfitId: string): string[] {
  const source = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  const result = Array.from(new Set(source));
  if (!result.length) result.push("everyday");
  if (!result.includes(outfitId)) result.push(outfitId);
  return result;
}

export function normalizeRoomState(input: unknown = {}): NormalizedRoomState {
  const source = recordOf(input);
  const environmentSource = recordOf(source.environment);
  const outfitId = nullableString(source.outfitId) ?? nullableString(recordOf(source.equippedWegoItems).outfit) ?? "everyday";
  const equipmentSource = recordOf(source.equippedRoomItems);
  const wegoEquipmentSource = recordOf(source.equippedWegoItems);
  const equippedRoomItems = defaultEquippedRoomItems();
  for (const slot of roomSlots) equippedRoomItems[slot] = nullableString(equipmentSource[slot]);
  const equippedWegoItems: EquippedWegoItems = {
    outfit: nullableString(wegoEquipmentSource.outfit) ?? outfitId,
    accessory: nullableString(wegoEquipmentSource.accessory),
    emotion: nullableString(wegoEquipmentSource.emotion),
  };

  return {
    environment: {
      lamp: enumValue(environmentSource.lamp, ["on", "off"], defaultEnvironment.lamp),
      curtains: enumValue(environmentSource.curtains, ["open", "closed"], defaultEnvironment.curtains),
      table: enumValue(environmentSource.table, ["empty", "tea-ready"], defaultEnvironment.table),
      plants: enumValue(environmentSource.plants, ["healthy", "needs-care"], defaultEnvironment.plants),
      window: enumValue(environmentSource.window, ["quiet", "rainy"], defaultEnvironment.window),
    },
    equippedRoomItems,
    equippedWegoItems,
    unlockedItemIds: normalizedOwnedItems(source.unlockedItemIds, equippedWegoItems.outfit),
    outfitId: equippedWegoItems.outfit,
  };
}
