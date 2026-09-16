import type { DailyAnswer, RevealViewModel } from "./types";
import { deriveInsight } from "./insights";
import type { MoodId } from "./types";

export function canReveal(today: { myMood: MoodId | null; partnerMood: MoodId | null }): boolean {
  return Boolean(today.myMood && today.partnerMood);
}

export function buildRevealViewModel(
  input: { date: string; my: DailyAnswer; partner: DailyAnswer; myGuess: MoodId | null; partnerGuess: MoodId | null },
  names: { meName: string; partnerName: string },
): RevealViewModel {
  if (!input.my.mood || !input.my.energy || !input.my.want || !input.partner.mood || !input.partner.energy || !input.partner.want) {
    throw new Error("REVEAL_LOCKED");
  }
  return {
    date: input.date,
    my: { mood: input.my.mood, energy: input.my.energy, want: input.my.want, note: input.my.note ?? null },
    partner: { mood: input.partner.mood, energy: input.partner.energy, want: input.partner.want, note: input.partner.note ?? null },
    guess: { selected: input.myGuess, correct: input.myGuess ? input.myGuess === input.partner.mood : null },
    insight: deriveInsight({
      myMood: input.my.mood,
      myEnergy: input.my.energy,
      myWant: input.my.want,
      partnerMood: input.partner.mood,
      partnerEnergy: input.partner.energy,
      partnerWant: input.partner.want,
      meName: names.meName,
      partnerName: names.partnerName,
    }),
  };
}
