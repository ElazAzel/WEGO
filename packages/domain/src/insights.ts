import type { EnergyId, MoodId, Tone, WantId } from "./types";

type InsightInput = {
  myMood: MoodId | null;
  myEnergy: EnergyId | null;
  myWant: WantId | null;
  partnerMood: MoodId | null;
  partnerEnergy: EnergyId | null;
  partnerWant: WantId | null;
  meName?: string;
  partnerName?: string;
};

export function deriveInsight(input: InsightInput): { key: string; text: string; tone: Tone } {
  if (input.myEnergy && input.partnerEnergy && input.myWant && input.partnerWant && input.myEnergy !== input.partnerEnergy && input.myWant === input.partnerWant) {
    return { key: "different-energy-shared-want", text: "У вас разный запас энергии, но обоим хочется быть рядом. Иногда этого уже достаточно.", tone: "paper" };
  }
  if (input.myMood && input.partnerMood && input.myMood === input.partnerMood) {
    return { key: "same-mood", text: "Сегодня вы звучите в одном ритме.", tone: "lilac" };
  }
  return { key: "neutral", text: "Wego заметил ваш сегодняшний ритм.", tone: "paper" };
}
