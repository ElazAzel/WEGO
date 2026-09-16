import type { RoomObjectId } from "@wego/domain";
import type { WorldActionType } from "../../store/use-app-store";

export interface RoomHotspot {
  id: RoomObjectId | "wego";
  label: string;
  action: WorldActionType;
  objectId?: RoomObjectId;
  className: string;
  icon: string;
}

export const roomHotspots: readonly RoomHotspot[] = [
  { id: "wego", label: "Погладить Вего", action: "pet", className: "room-hotspot--wego", icon: "✦" },
];
