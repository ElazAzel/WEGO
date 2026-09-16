import type { EnergyId, MoodId, Tone, WantId } from "./types";

export const MOOD_OPTIONS: ReadonlyArray<{ id: MoodId; label: string; tone: Tone; emoji: string }> = [
  { id: "great", label: "Отлично", tone: "yellow", emoji: "☀" },
  { id: "good", label: "Хорошо", tone: "mint", emoji: "◐" },
  { id: "calm", label: "Спокойно", tone: "lilac", emoji: "◑" },
  { id: "normal", label: "Обычно", tone: "paper", emoji: "◔" },
  { id: "overloaded", label: "Перегружен", tone: "coral", emoji: "◕" },
  { id: "hard", label: "Тяжело", tone: "paper", emoji: "◒" },
  { id: "irritated", label: "Раздражён", tone: "coral", emoji: "◓" },
];

export const ENERGY_OPTIONS: ReadonlyArray<{ id: EnergyId; label: string }> = [
  { id: "high", label: "Много" },
  { id: "mid", label: "Нормально" },
  { id: "low", label: "Мало" },
];

export const WANT_OPTIONS: ReadonlyArray<{ id: WantId; label: string; tone: Tone }> = [
  { id: "together", label: "Побыть вместе", tone: "mint" },
  { id: "talk", label: "Поговорить", tone: "lilac" },
  { id: "rest", label: "Отдохнуть", tone: "yellow" },
  { id: "alone", label: "Побыть одному", tone: "paper" },
  { id: "fun", label: "Развлечься", tone: "coral" },
  { id: "walk", label: "Погулять", tone: "mint" },
  { id: "support", label: "Поддержки", tone: "lilac" },
];

export const EVOLUTION_THRESHOLDS = { egg: 3, baby: 7 } as const;

export function moodLabel(id: MoodId | null | undefined): string {
  return MOOD_OPTIONS.find((option) => option.id === id)?.label ?? "—";
}

export function energyLabel(id: EnergyId | null | undefined): string {
  return ENERGY_OPTIONS.find((option) => option.id === id)?.label ?? "—";
}

export function wantLabel(id: WantId | null | undefined): string {
  return WANT_OPTIONS.find((option) => option.id === id)?.label ?? "—";
}
