export type MoodId = "great" | "good" | "calm" | "normal" | "overloaded" | "hard" | "irritated";
export type EnergyId = "high" | "mid" | "low";
export type WantId = "together" | "talk" | "rest" | "alone" | "fun" | "walk" | "support";
export type Tone = "coral" | "lilac" | "mint" | "yellow" | "peach" | "paper";
export type SpaceType = "pair" | "friends" | "family";
export type WegoStage = "egg" | "baby" | "adult";
export type WegoStyle = "a" | "b";
export type HomeVariant = "v1" | "v2";
export type RevealVariant = "v1" | "v2";
export type StoryType = "reveal" | "evolution" | "result" | "activity" | "note";

export interface CheckinInput {
  mood: MoodId;
  energy: EnergyId;
  want: WantId;
  note: string;
  clientMutationId: string;
}

export interface DailyAnswer {
  date: string;
  mood: MoodId | null;
  energy: EnergyId | null;
  want: WantId | null;
  note?: string | null;
}

export interface TodayState {
  date: string;
  my: DailyAnswer;
  partner: DailyAnswer | null;
  myGuess: MoodId | null;
  partnerGuess: MoodId | null;
  revealed: boolean;
}

export interface RevealViewModel {
  date: string;
  my: { mood: MoodId; energy: EnergyId; want: WantId; note: string | null };
  partner: { mood: MoodId; energy: EnergyId; want: WantId; note: string | null };
  guess: { selected: MoodId | null; correct: boolean | null };
  insight: { key: string; text: string; tone: Tone };
}

export interface StoryEntry {
  id: string;
  sourceType?: StoryType;
  sourceId?: string;
  date: string;
  type: StoryType;
  title: string;
  body: string;
  tone: Tone;
  createdAt?: string;
}

export interface EvolutionResult {
  stage: WegoStage;
  streak: number;
  didEvolve: boolean;
}
