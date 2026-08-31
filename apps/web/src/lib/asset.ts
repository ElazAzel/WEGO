import type { WegoStage, WegoStyle } from "@wego/domain";

export function wegoAsset(style: WegoStyle, stage: WegoStage): string { return `/assets/wego/style-${style}-${stage}.png`; }
export function roomAsset(room: "warm" | "morning"): string { return room === "morning" ? "/assets/rooms/room-soft-morning.png" : "/assets/rooms/room-warm-evening.png"; }
export function roomBackgroundAsset(room: "warm" | "morning"): string { return room === "morning" ? "/assets/rooms/v3/room-morning-background.png" : "/assets/rooms/v3/room-warm-background.png"; }
