import { z } from "zod";
import { defaultEquippedRoomItems, defaultEquippedWegoItems, defaultRoomEnvironment, type EquippedRoomItems, type EquippedWegoItems, type RoomInteraction, normalizeRoomState } from "./room-state";
import { defaultCozyWorldState, normalizeCozyWorldState, moveInItemIds, roomVibes, pulseKinds, type CozyWorldState, type MoveInItemId, type PartnerPulseKind, type RoomVibe } from "./cozy-world";

export const needIds = ["hunger", "energy", "joy", "connection", "comfort"] as const;
export type WegoNeedId = (typeof needIds)[number];
export type WegoMood = "sleepy" | "cozy" | "curious" | "playful" | "loved";
export type RoomObjectId = "bowl" | "toy" | "plant" | "journal" | "clutter" | "lamp" | "shelf" | "window" | "table";
export type WegoActionType = "feed" | "pet" | "play" | "tidy" | "decorate" | "outfit" | "plan_complete" | "memory" | "room_interact" | "set_vibe" | "ritual" | "pulse" | "game_answer" | "quest_claim" | "move_in_start" | "move_in_place";
export const ritualIds = ["tea", "blanket", "dance", "photo", "snack", "hug"] as const;
export type RitualId = (typeof ritualIds)[number];

export interface WegoNeeds {
  hunger: number;
  energy: number;
  joy: number;
  connection: number;
  comfort: number;
}

export interface RoomObjectState {
  id: RoomObjectId;
  level: number;
  isVisible: boolean;
  isInteractive: boolean;
  lastInteractedAt: string | null;
}

export interface WegoAction {
  id: string;
  type: WegoActionType;
  actorId: string;
  objectId?: RoomObjectId;
  interaction?: RoomInteraction["interaction"];
  itemId?: string;
  vibe?: RoomVibe;
  ritual?: RitualId;
  pulseKind?: PartnerPulseKind;
  gameAnswer?: RoomVibe;
  moveInItem?: MoveInItemId;
  at: string;
}

export type WorldAction = WegoAction;

export interface SharedPlan {
  id: string;
  title: string;
  date: string;
  createdBy: string;
  completedBy: string[];
  tone: "coral" | "lilac" | "mint" | "yellow";
}

export interface MemoryEntry {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  kind: "plan" | "game" | "care" | "note";
  tone: "coral" | "lilac" | "mint" | "yellow";
}

export interface WorldSnapshot {
  version: 1;
  updatedAt: string;
  needs: WegoNeeds;
  mood: WegoMood;
  affection: number;
  level: number;
  interactionStreak: number;
  roomObjects: Record<RoomObjectId, RoomObjectState>;
  outfitId: string;
  unlockedItemIds: string[];
  actionKeys: string[];
  plans: SharedPlan[];
  memories: MemoryEntry[];
  environment: ReturnType<typeof defaultRoomEnvironment>;
  equippedRoomItems: EquippedRoomItems;
  equippedWegoItems: EquippedWegoItems;
  cozy: CozyWorldState;
}

export interface WorldReward {
  idempotencyKey: string;
  amount: number;
  reason: "care" | "play" | "tidy" | "plan" | "memory" | "daily";
  label: string;
}

export interface WorldActionResult {
  snapshot: WorldSnapshot;
  reward: WorldReward | null;
  message: string;
}

export const WegoActionSchema = z.object({
  id: z.string().min(1).max(120),
  type: z.enum(["feed", "pet", "play", "tidy", "decorate", "outfit", "plan_complete", "memory", "room_interact", "set_vibe", "ritual", "pulse", "game_answer", "quest_claim", "move_in_start", "move_in_place"]),
  actorId: z.string().min(1).max(120),
  objectId: z.enum(["bowl", "toy", "plant", "journal", "clutter", "lamp", "shelf", "window", "table"]).optional(),
  interaction: z.enum(["toggle", "toggle-curtains", "serve-tea", "collect-tea", "water"]).optional(),
  itemId: z.string().min(1).max(120).optional(),
  vibe: z.enum(roomVibes).optional(),
  ritual: z.enum(ritualIds).optional(),
  pulseKind: z.enum(pulseKinds).optional(),
  gameAnswer: z.enum(roomVibes).optional(),
  moveInItem: z.enum(moveInItemIds).optional(),
  at: z.string().datetime(),
});

export function createInitialWorld(now = new Date().toISOString()): WorldSnapshot {
  const object = (id: RoomObjectId, level = 1): RoomObjectState => ({ id, level, isVisible: true, isInteractive: true, lastInteractedAt: null });
  const roomState = normalizeRoomState({ unlockedItemIds: ["everyday", "soft-blanket"], outfitId: "everyday" });
  return {
    version: 1,
    updatedAt: now,
    needs: { hunger: 76, energy: 64, joy: 58, connection: 50, comfort: 72 },
    mood: "cozy",
    affection: 12,
    level: 1,
    interactionStreak: 1,
    roomObjects: {
      bowl: object("bowl"), toy: object("toy"), plant: object("plant"), journal: object("journal"),
      clutter: { ...object("clutter"), isInteractive: false, level: 0 }, lamp: object("lamp"), shelf: object("shelf"),
      window: object("window"), table: object("table"),
    },
    outfitId: roomState.outfitId,
    unlockedItemIds: roomState.unlockedItemIds,
    actionKeys: [],
    plans: [],
    memories: [],
    environment: roomState.environment,
    equippedRoomItems: roomState.equippedRoomItems ?? defaultEquippedRoomItems(),
    equippedWegoItems: roomState.equippedWegoItems ?? defaultEquippedWegoItems(roomState.outfitId),
    cozy: defaultCozyWorldState(now.slice(0, 10)),
  };
}

export function normalizeWorld(snapshot: Partial<WorldSnapshot> | null | undefined, now = new Date().toISOString()): WorldSnapshot {
  const base = createInitialWorld(now);
  if (!snapshot) return base;
  const roomState = normalizeRoomState(snapshot);
  return {
    ...base,
    ...snapshot,
    version: 1,
    updatedAt: typeof snapshot.updatedAt === "string" ? snapshot.updatedAt : now,
    roomObjects: { ...base.roomObjects, ...(snapshot.roomObjects ?? {}) },
    environment: roomState.environment,
    equippedRoomItems: roomState.equippedRoomItems,
    equippedWegoItems: roomState.equippedWegoItems,
    unlockedItemIds: roomState.unlockedItemIds,
    outfitId: roomState.outfitId,
    actionKeys: Array.isArray(snapshot.actionKeys) ? snapshot.actionKeys.filter((id): id is string => typeof id === "string") : [],
    plans: Array.isArray(snapshot.plans) ? snapshot.plans : [],
    memories: Array.isArray(snapshot.memories) ? snapshot.memories : [],
    cozy: normalizeCozyWorldState(snapshot.cozy, now.slice(0, 10)),
  };
}

export function welcomeBackMessage(lastSeenAt: string, now = new Date().toISOString()): string | null {
  const last = Date.parse(lastSeenAt);
  const current = Date.parse(now);
  if (!Number.isFinite(last) || !Number.isFinite(current) || current <= last || current - last < 36 * 60 * 60 * 1000) return null;
  return "Рад снова видеть вас. Ничего не пропало — можно продолжить с того же места.";
}
