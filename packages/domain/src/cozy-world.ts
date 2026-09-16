export const roomVibes = ["slow-morning", "rainy-date", "study-buddy", "night-cozy", "tiny-party"] as const;
export type RoomVibe = (typeof roomVibes)[number];

export const roomPhases = ["showcase", "move-in", "settled"] as const;
export type RoomPhase = (typeof roomPhases)[number];

export const moveInSteps = ["welcome", "meet-wego", "first-ritual", "first-furniture", "complete"] as const;
export type MoveInStep = (typeof moveInSteps)[number];

export const moveInItemIds = ["rug"] as const;
export type MoveInItemId = (typeof moveInItemIds)[number];

export const wegoPoses = ["idle", "happy", "sleepy", "curious", "cozy", "party", "waiting"] as const;
export type WegoPose = (typeof wegoPoses)[number];

export const pulseKinds = ["heart", "hug", "wave", "tea", "note"] as const;
export type PartnerPulseKind = (typeof pulseKinds)[number];

export interface PartnerPulse {
  id: string;
  kind: PartnerPulseKind;
  createdAt: string;
  createdBy: string;
  status: "sent" | "answered";
}

export interface GameSession {
  id: string;
  type: "choose-vibe";
  status: "waiting" | "completed";
  createdBy: string;
  myAnswer: RoomVibe | null;
  partnerAnswer: RoomVibe | null;
  result: "match" | "mixed" | null;
  createdAt: string;
}

export interface DailyQuest {
  id: string;
  kind: "ritual";
  title: string;
  description: string;
  reward: number;
  status: "ready" | "claimed";
}

export interface CozyWorldState {
  roomPhase: RoomPhase;
  moveInStep: MoveInStep;
  roomBuildLevel: number;
  vibe: RoomVibe;
  pose: WegoPose;
  memoryWall: string[];
  pulses: PartnerPulse[];
  game: GameSession | null;
  dailyQuest: DailyQuest;
}

export interface MemoryCopy {
  title: string;
  body: string;
}

type UnknownRecord = Record<string, unknown>;

function recordOf(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function isRoomVibe(value: unknown): value is RoomVibe {
  return typeof value === "string" && roomVibes.includes(value as RoomVibe);
}

function isWegoPose(value: unknown): value is WegoPose {
  return typeof value === "string" && wegoPoses.includes(value as WegoPose);
}

function datePart(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date(value).toISOString().slice(0, 10);
}

export function dailyQuestForDate(date: string): DailyQuest {
  const day = datePart(date);
  return {
    id: `quest-${day}-ritual`,
    kind: "ritual",
    title: "Маленький ритуал",
    description: "Выберите для Вего один тёплый жест сегодня.",
    reward: 8,
    status: "ready",
  };
}

export function defaultCozyWorldState(date = new Date().toISOString().slice(0, 10)): CozyWorldState {
  return { roomPhase: "showcase", moveInStep: "welcome", roomBuildLevel: 6, vibe: "slow-morning", pose: "idle", memoryWall: [], pulses: [], game: null, dailyQuest: dailyQuestForDate(date) };
}

function normalizeDailyQuest(value: unknown, date: string): DailyQuest {
  const source = recordOf(value);
  const fallback = dailyQuestForDate(date);
  return {
    ...fallback,
    id: typeof source.id === "string" && source.id.trim() ? source.id : fallback.id,
    status: source.status === "claimed" ? "claimed" : "ready",
  };
}

function normalizePulse(value: unknown): PartnerPulse | null {
  const source = recordOf(value);
  if (typeof source.id !== "string" || !source.id.trim() || typeof source.createdAt !== "string" || typeof source.createdBy !== "string") return null;
  if (typeof source.kind !== "string" || !pulseKinds.includes(source.kind as PartnerPulseKind)) return null;
  return { id: source.id, kind: source.kind as PartnerPulseKind, createdAt: source.createdAt, createdBy: source.createdBy, status: source.status === "answered" ? "answered" : "sent" };
}

function normalizeGame(value: unknown): GameSession | null {
  const source = recordOf(value);
  if (source.type !== "choose-vibe" || typeof source.id !== "string" || typeof source.createdAt !== "string" || typeof source.createdBy !== "string") return null;
  const myAnswer = isRoomVibe(source.myAnswer) ? source.myAnswer : null;
  const partnerAnswer = isRoomVibe(source.partnerAnswer) ? source.partnerAnswer : null;
  const completed = source.status === "completed" && myAnswer && partnerAnswer;
  return { id: source.id, type: "choose-vibe", status: completed ? "completed" : "waiting", createdBy: source.createdBy, myAnswer, partnerAnswer, result: completed ? (myAnswer === partnerAnswer ? "match" : "mixed") : null, createdAt: source.createdAt };
}

function isRoomPhase(value: unknown): value is RoomPhase {
  return typeof value === "string" && roomPhases.includes(value as RoomPhase);
}

function isMoveInStep(value: unknown): value is MoveInStep {
  return typeof value === "string" && moveInSteps.includes(value as MoveInStep);
}

export function normalizeCozyWorldState(value: unknown, date = new Date().toISOString().slice(0, 10)): CozyWorldState {
  const source = recordOf(value);
  const roomPhase = isRoomPhase(source.roomPhase) ? source.roomPhase : "move-in";
  const moveInStep = isMoveInStep(source.moveInStep) ? source.moveInStep : roomPhase === "showcase" ? "welcome" : roomPhase === "settled" ? "complete" : "meet-wego";
  const roomBuildLevel = typeof source.roomBuildLevel === "number" && Number.isFinite(source.roomBuildLevel)
    ? Math.max(0, Math.min(6, Math.round(source.roomBuildLevel)))
    : roomPhase === "showcase" ? 6 : roomPhase === "settled" ? 1 : 0;
  const wallSource = Array.isArray(source.memoryWall) ? source.memoryWall : [];
  const memoryWall = Array.from(new Set(wallSource.filter((id): id is string => typeof id === "string" && Boolean(id.trim())))).slice(0, 5);
  const pulses = (Array.isArray(source.pulses) ? source.pulses : []).map(normalizePulse).filter((pulse): pulse is PartnerPulse => Boolean(pulse)).slice(0, 20);
  return {
    roomPhase,
    moveInStep,
    roomBuildLevel,
    vibe: isRoomVibe(source.vibe) ? source.vibe : "slow-morning",
    pose: isWegoPose(source.pose) ? source.pose : "idle",
    memoryWall,
    pulses,
    game: normalizeGame(source.game),
    dailyQuest: normalizeDailyQuest(source.dailyQuest, date),
  };
}

export function memoryCopyFor(kind: "ritual" | "pair-game" | "pulse", vibe: RoomVibe): MemoryCopy {
  if (kind === "pair-game") return { title: "Вайб совпал", body: vibe === "night-cozy" ? "Сегодня вы оба выбрали ночную ламповую." : "Вы выбрали настроение для общей комнаты." };
  if (kind === "pulse") return { title: "Маленький знак рядом", body: "В комнату прилетела тёплая реакция партнёра." };
  return { title: "Маленький ритуал", body: "В комнате стало чуть теплее." };
}
