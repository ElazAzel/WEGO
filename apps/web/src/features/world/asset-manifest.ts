import type { WegoStage, WegoStyle } from "@wego/domain";
import { wegoAsset } from "../../lib/asset";
import { withPublicBase } from "../../lib/public-url";

export type WegoSceneState = "idle" | "pet";

const generatedAssets = {
  idle: withPublicBase("/assets/wego/v2/wego-idle.png"),
  pet: withPublicBase("/assets/wego/v2/wego-pet-wave.png"),
} as const;

export function getWegoSceneAsset(_style: WegoStyle, _stage: WegoStage, state: WegoSceneState, _outfitId = "everyday"): string {
  return generatedAssets[state] ?? wegoAsset(_style, _stage);
}

export function getWegoSceneFallback(style: WegoStyle, stage: WegoStage): string {
  return wegoAsset(style, stage);
}
