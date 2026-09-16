import type { RoomPhase, RoomSlot } from "@wego/domain";

export type CozyObjectId = "fairy-lights" | "speaker" | "memory-wall" | "note-board" | "console" | "candle" | "mirror" | "gift-box";
export type CozyObjectAction = "toggle-lights" | "open-vibes" | "open-memories" | "send-pulse" | "open-game" | "toggle-candle" | "open-wardrobe" | "claim-quest";

export interface CozyObjectSprite {
  id: CozyObjectId;
  label: string;
  src: string;
  action: CozyObjectAction;
  position: { left: number; top: number; width: number; zIndex: number };
  itemId?: string;
  slot?: RoomSlot;
  visibleFromBuildLevel?: number;
  phases?: readonly RoomPhase[];
}

const asset = (name: string) => `/assets/rooms/v4/props/${name}.png`;

export const cozyCharacterZIndex = 9;

export const cozyObjectSprites: readonly CozyObjectSprite[] = [
  { id: "fairy-lights", label: "Включить гирлянду", src: asset("fairy-lights"), action: "toggle-lights", position: { left: 13, top: 1, width: 74, zIndex: 2 }, itemId: "fairy-lights-neon", slot: "wall" },
  { id: "speaker", label: "Выбрать вайб комнаты", src: asset("speaker-vinyl"), action: "open-vibes", position: { left: 77, top: 59, width: 14, zIndex: 3 }, itemId: "vinyl-speaker-cozy", slot: "shelf" },
  { id: "memory-wall", label: "Открыть стену воспоминаний", src: asset("memory-wall"), action: "open-memories", position: { left: 7, top: 20, width: 18, zIndex: 2 }, itemId: "memory-wall-soft", slot: "wall" },
  { id: "note-board", label: "Оставить тёплый знак партнёру", src: asset("note-board"), action: "send-pulse", position: { left: 75, top: 19, width: 16, zIndex: 2 }, itemId: "note-board-stickers", slot: "shelf" },
  { id: "console", label: "Сыграть вместе", src: asset("console-cozy"), action: "open-game", position: { left: 42, top: 70, width: 15, zIndex: 3 }, visibleFromBuildLevel: 2 },
  { id: "candle", label: "Зажечь свечу", src: asset("candle-glow"), action: "toggle-candle", position: { left: 67, top: 57, width: 8, zIndex: 3 }, itemId: "candle-night", slot: "table" },
  { id: "mirror", label: "Открыть гардероб Вего", src: asset("mirror-cozy"), action: "open-wardrobe", position: { left: 88, top: 27, width: 8, zIndex: 2 }, itemId: "mirror-mint", slot: "wall" },
  { id: "gift-box", label: "Открыть ежедневную капсулу", src: asset("gift-box"), action: "claim-quest", position: { left: 27, top: 68, width: 10, zIndex: 3 }, phases: ["showcase", "move-in"] },
];
