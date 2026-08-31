import type { EvolutionResult, MoodId, WegoStage } from "./types";
import { EVOLUTION_THRESHOLDS } from "./constants";

const sharedGoodMoods = new Set<MoodId>(["good", "great"]);

export function calculateEvolution(stage: WegoStage, sharedDailyMoods: ReadonlyArray<MoodId | null>): EvolutionResult {
  let streak = 0;
  for (let i = sharedDailyMoods.length - 1; i >= 0; i -= 1) {
    const mood = sharedDailyMoods[i];
    if (!mood || !sharedGoodMoods.has(mood)) break;
    streak += 1;
  }
  const threshold = EVOLUTION_THRESHOLDS[stage as "egg" | "baby"];
  const didEvolve = stage !== "adult" && streak >= threshold;
  const nextStage: WegoStage = stage === "egg" && didEvolve ? "baby" : stage === "baby" && didEvolve ? "adult" : stage;
  return { stage: nextStage, streak, didEvolve };
}
