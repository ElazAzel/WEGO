import type { RoomEnvironmentState, RoomInteraction, RoomObjectId } from "@wego/domain";
import type { WorldActionType } from "../../store/use-app-store";

export type RoomSpriteId = "sofa" | "rug" | "bowl" | "lamp" | "table" | "shelf" | "plants" | "curtains-closed" | "tea-set";

export interface RoomSpriteDefinition {
  id: RoomSpriteId;
  src: string;
  className: string;
  label: string;
  zIndex: number;
  objectId?: RoomObjectId;
  action?: WorldActionType;
  interactive?: boolean;
}

const spriteAssets: Record<RoomSpriteId, string> = {
  sofa: "/assets/rooms/v3/props/sofa-cozy.png",
  rug: "/assets/rooms/v3/props/rug-mint.png",
  bowl: "/assets/rooms/v3/props/bowl-food.png",
  lamp: "/assets/rooms/v3/props/lamp-coral.png",
  table: "/assets/rooms/v3/props/coffee-table-gifts.png",
  shelf: "/assets/rooms/v3/props/bookshelf-cozy.png",
  plants: "/assets/rooms/v3/props/plants-cozy.png",
  "curtains-closed": "/assets/rooms/v3/props/curtains-closed.png",
  "tea-set": "/assets/rooms/v3/props/tea-set.png",
};

export const roomSprites: readonly RoomSpriteDefinition[] = [
  { id: "rug", src: roomSpriteAsset("rug"), className: "room-sprite--rug", label: "Устроиться поуютнее на ковре", zIndex: 1, objectId: "clutter", action: "tidy", interactive: true },
  { id: "sofa", src: roomSpriteAsset("sofa"), className: "room-sprite--sofa", label: "Поиграть на диване", zIndex: 2, objectId: "toy", action: "play", interactive: true },
  { id: "bowl", src: roomSpriteAsset("bowl"), className: "room-sprite--bowl", label: "Покормить Вего", zIndex: 3, objectId: "bowl", action: "feed", interactive: true },
  { id: "lamp", src: roomSpriteAsset("lamp"), className: "room-sprite--lamp", label: "Включить тёплый свет", zIndex: 3, objectId: "lamp", action: "decorate", interactive: true },
  { id: "table", src: roomSpriteAsset("table"), className: "room-sprite--table", label: "Рассмотреть сюрприз на столике", zIndex: 3, objectId: "journal", action: "decorate", interactive: true },
  { id: "shelf", src: roomSpriteAsset("shelf"), className: "room-sprite--shelf", label: "Открыть полку воспоминаний", zIndex: 3, objectId: "shelf", action: "decorate", interactive: true },
  { id: "plants", src: roomSpriteAsset("plants"), className: "room-sprite--plants", label: "Позаботиться о растениях", zIndex: 3, objectId: "plant", action: "tidy", interactive: true },
];

export function roomSpriteAsset(id: RoomSpriteId): string {
  return spriteAssets[id];
}

export function roomInteractionFor(objectId: "lamp" | "window" | "table" | "plant", environment: RoomEnvironmentState): RoomInteraction {
  if (objectId === "lamp") return { objectId, interaction: "toggle" };
  if (objectId === "window") return { objectId, interaction: "toggle-curtains" };
  if (objectId === "plant") return { objectId, interaction: "water" };
  return { objectId, interaction: environment.table === "tea-ready" ? "collect-tea" : "serve-tea" };
}
