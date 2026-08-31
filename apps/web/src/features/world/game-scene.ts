import type { RoomInteraction, RoomObjectId, WegoActionType, WorldSnapshot } from "@wego/domain";
import { getCatalogItem } from "@wego/domain";

export type SceneEntityId = "background" | "rug" | "sofa" | "lamp" | "window" | "table" | "wego";
export type WegoRuntimeState = "idle" | "walking" | "curious" | "happy" | "cozy" | "sleepy" | "waiting" | "playing";
export type SceneEffect = "pet" | "lamp-toggle" | "curtains-toggle" | "tea-serve" | "tea-collect" | "sofa-play";

export interface ScenePoint {
  x: number;
  y: number;
}

export interface SceneEntityDefinition {
  id: SceneEntityId;
  assetId: string;
  position: ScenePoint;
  size: { width: number; height: number };
  zIndex: number;
  interactionAnchor?: ScenePoint;
  interactive?: boolean;
}

export type ScenePhase =
  | { type: "goto" | "return"; state: WegoRuntimeState; durationMs: number }
  | { type: "react" | "feedback"; state: WegoRuntimeState; durationMs: number }
  | { type: "effect"; effect: SceneEffect; durationMs: number };

export interface SceneIntent {
  id: string;
  targetId: SceneEntityId;
  kind: "interact" | "pet";
}

export interface ScenePlan {
  id: string;
  targetId: SceneEntityId;
  targetAnchor: ScenePoint;
  phases: ScenePhase[];
}

export interface SceneEquipmentProjection {
  id: string;
  itemId: string;
  hostId: SceneEntityId;
  assetId: string;
}

export type SceneCommand =
  | { kind: "room"; interaction: RoomInteraction }
  | { kind: "world"; action: Exclude<WegoActionType, "room_interact">; objectId?: RoomObjectId };

export const roomEntityManifest: readonly SceneEntityDefinition[] = [
  { id: "background", assetId: "room-background", position: { x: 0, y: 0 }, size: { width: 600, height: 630 }, zIndex: 0 },
  { id: "rug", assetId: "rug-mint", position: { x: 116, y: 408 }, size: { width: 374, height: 190 }, zIndex: 10 },
  { id: "window", assetId: "room-window", position: { x: 62, y: 126 }, size: { width: 214, height: 272 }, zIndex: 20, interactionAnchor: { x: 226, y: 408 }, interactive: true },
  { id: "sofa", assetId: "sofa-cozy", position: { x: 62, y: 348 }, size: { width: 238, height: 210 }, zIndex: 30, interactionAnchor: { x: 250, y: 442 }, interactive: true },
  { id: "lamp", assetId: "lamp-coral", position: { x: 382, y: 268 }, size: { width: 112, height: 196 }, zIndex: 32, interactionAnchor: { x: 420, y: 416 }, interactive: true },
  { id: "table", assetId: "coffee-table-gifts", position: { x: 388, y: 392 }, size: { width: 164, height: 164 }, zIndex: 34, interactionAnchor: { x: 388, y: 466 }, interactive: true },
  { id: "wego", assetId: "wego", position: { x: 300, y: 472 }, size: { width: 176, height: 176 }, zIndex: 40, interactionAnchor: { x: 300, y: 472 }, interactive: true },
] as const;

const defaultWegoAnchor: ScenePoint = { x: 300, y: 472 };

export class SceneDirector {
  private activeIntentId: string | null = null;

  constructor(private readonly manifest: readonly SceneEntityDefinition[]) {}

  get busy(): boolean {
    return this.activeIntentId !== null;
  }

  begin(intent: SceneIntent, world: WorldSnapshot): ScenePlan | null {
    if (this.activeIntentId) return null;
    const target = this.manifest.find((entity) => entity.id === intent.targetId);
    if (!target?.interactive) return null;
    const targetAnchor = target.interactionAnchor ?? defaultWegoAnchor;
    const effect = effectFor(intent.targetId, world);
    if (!effect) return null;
    this.activeIntentId = intent.id;
    if (intent.targetId === "wego") {
      return {
        id: intent.id,
        targetId: intent.targetId,
        targetAnchor,
        phases: [
          { type: "react", state: "curious", durationMs: 120 },
          { type: "effect", effect, durationMs: 260 },
          { type: "feedback", state: "happy", durationMs: 420 },
          { type: "return", state: "idle", durationMs: 220 },
        ],
      };
    }
    return {
      id: intent.id,
      targetId: intent.targetId,
      targetAnchor,
      phases: [
        { type: "goto", state: "walking", durationMs: 520 },
        { type: "react", state: "curious", durationMs: 180 },
        { type: "effect", effect, durationMs: 240 },
        { type: "feedback", state: intent.targetId === "sofa" ? "playing" : "happy", durationMs: 360 },
        { type: "return", state: "idle", durationMs: 420 },
      ],
    };
  }

  complete(intentId: string): boolean {
    if (this.activeIntentId !== intentId) return false;
    this.activeIntentId = null;
    return true;
  }
}

export function projectEquippedEntities(world: WorldSnapshot): SceneEquipmentProjection[] {
  const result: SceneEquipmentProjection[] = [];
  const hosts: Array<[keyof WorldSnapshot["equippedRoomItems"], SceneEntityId]> = [
    ["sofa", "sofa"],
    ["rug", "rug"],
    ["lamp", "lamp"],
    ["table", "table"],
  ];
  for (const [slot, hostId] of hosts) {
    const itemId = world.equippedRoomItems[slot];
    if (!itemId) continue;
    const item = getCatalogItem(itemId);
    if (!item) continue;
    result.push({ id: `equipped-${slot}`, itemId, hostId, assetId: item.assetId });
  }
  return result;
}

export function roomRendererForFlag(flag: string | undefined): "pixi" | "dom" {
  return flag === "false" ? "dom" : "pixi";
}

export function wegoVisualFrame(state: WegoRuntimeState, seconds: number): { width: number; height: number; rotation: number } {
  const pulse = state === "happy" ? 1.035 : 1 + Math.sin(seconds * 2.2) * 0.008;
  return {
    width: 176 * pulse,
    height: 176 * pulse,
    rotation: state === "happy" ? Math.sin(seconds * 10) * 0.025 : Math.sin(seconds * 1.4) * 0.009,
  };
}

export function sceneCommandForTarget(targetId: SceneEntityId, world: WorldSnapshot): SceneCommand | null {
  if (targetId === "wego") return { kind: "world", action: "pet", objectId: "toy" };
  if (targetId === "sofa") return { kind: "world", action: "play", objectId: "toy" };
  if (targetId === "lamp") return { kind: "room", interaction: { objectId: "lamp", interaction: "toggle" } };
  if (targetId === "window") return { kind: "room", interaction: { objectId: "window", interaction: "toggle-curtains" } };
  if (targetId === "table") return { kind: "room", interaction: { objectId: "table", interaction: world.environment.table === "tea-ready" ? "collect-tea" : "serve-tea" } };
  return null;
}

export function visibleRoomEntityIds(world: WorldSnapshot): SceneEntityId[] {
  if (world.cozy.roomPhase === "showcase") return roomEntityManifest.map((entity) => entity.id);
  if (world.cozy.roomPhase === "move-in") return ["background", "window", "wego"];
  const requiredLevel: Partial<Record<SceneEntityId, number>> = { rug: 1, sofa: 2, lamp: 3, table: 3 };
  return roomEntityManifest
    .filter((entity) => {
      if (entity.id === "background" || entity.id === "window" || entity.id === "wego") return true;
      const slot = entity.id === "rug" || entity.id === "sofa" || entity.id === "lamp" || entity.id === "table" ? entity.id : null;
      if (slot && world.equippedRoomItems[slot]) return true;
      return world.cozy.roomBuildLevel >= (requiredLevel[entity.id] ?? Number.POSITIVE_INFINITY);
    })
    .map((entity) => entity.id);
}

function effectFor(targetId: SceneEntityId, world: WorldSnapshot): SceneEffect | null {
  if (targetId === "wego") return "pet";
  if (targetId === "lamp") return "lamp-toggle";
  if (targetId === "window") return "curtains-toggle";
  if (targetId === "table") return world.environment.table === "tea-ready" ? "tea-collect" : "tea-serve";
  if (targetId === "sofa") return "sofa-play";
  return null;
}
