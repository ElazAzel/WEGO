import { z } from "zod";

export type SparkReason = "care" | "play" | "tidy" | "plan" | "memory" | "daily" | "purchase" | "refund" | "gift";
export type CatalogItemKind = "outfit" | "room" | "emotion" | "accessory" | "interaction" | "sticker" | "memory_style" | "minigame_pack" | "animation";
export type CatalogCurrency = "sparks" | "XTR";
export type RewardGuardAction = "pet" | "memory" | "play";
export type RewardBlockReason = "daily_cap" | "limit" | "cooldown" | "duplicate_game";

export const DAILY_SPARK_CAP = 80;
export const PET_DAILY_LIMIT = 3;
export const PET_COOLDOWN_MS = 20 * 60 * 1000;
export const MEMORY_DAILY_LIMIT = 3;

export interface RewardGuardState {
  date: string;
  petCount: number;
  memoryCount: number;
  rewardedPlayTypes: string[];
  lastRewardedAtByAction: Partial<Record<RewardGuardAction, string>>;
}

export interface SparkWallet {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  dailyEarned: number;
  dailyEarnedDate: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: SparkReason;
  idempotencyKey: string;
  createdAt: string;
  metadata?: Record<string, string>;
}

export interface CatalogItem {
  id: string;
  title: string;
  description: string;
  kind: CatalogItemKind;
  sparkPrice: number | null;
  starsPrice: number | null;
  accent: "coral" | "lilac" | "mint" | "yellow";
  entitlement: "personal" | "space";
  assetId?: string;
  slot?: string | null;
  behavior?: string;
}

export interface Entitlement {
  id: string;
  userId: string;
  spaceId: string | null;
  itemId: string;
  source: "sparks" | "telegram_stars" | "grant";
  purchaseId: string | null;
  grantedAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  spaceId: string | null;
  itemId: string;
  currency: CatalogCurrency;
  amount: number;
  status: "pending" | "paid" | "refunded" | "failed";
  telegramPaymentChargeId: string | null;
  telegramProviderChargeId: string | null;
  createdAt: string;
  recipientUserId?: string | null;
}

export interface EconomyState {
  wallet: SparkWallet;
  ledger: LedgerEntry[];
  entitlements: Entitlement[];
  purchases: Purchase[];
  fulfilledKeys: string[];
  rewardGuards: RewardGuardState;
}

export const SparkTransactionSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive().max(1000),
  reason: z.enum(["care", "play", "tidy", "plan", "memory", "daily", "purchase", "refund", "gift"]),
  idempotencyKey: z.string().min(1).max(160),
});

export const CatalogItemSchema = z.object({
  id: z.string().min(1), title: z.string().min(1), description: z.string().min(1),
  kind: z.enum(["outfit", "room", "emotion", "accessory", "interaction", "sticker", "memory_style", "minigame_pack", "animation"]),
  sparkPrice: z.number().int().positive().nullable(), starsPrice: z.number().int().positive().nullable(),
  accent: z.enum(["coral", "lilac", "mint", "yellow"]), entitlement: z.enum(["personal", "space"]),
});

export function createInitialEconomy(userId: string, date: string): EconomyState {
  return { wallet: { userId, balance: 120, lifetimeEarned: 120, lifetimeSpent: 0, dailyEarned: 0, dailyEarnedDate: date }, ledger: [], entitlements: [], purchases: [], fulfilledKeys: [], rewardGuards: createInitialRewardGuards(date) };
}

export function createInitialRewardGuards(date: string): RewardGuardState {
  return { date, petCount: 0, memoryCount: 0, rewardedPlayTypes: [], lastRewardedAtByAction: {} };
}

export function normalizeEconomy(state: EconomyState, date = state.wallet.dailyEarnedDate): EconomyState {
  const guards = state.rewardGuards;
  if (!guards || guards.date !== date) return { ...state, rewardGuards: createInitialRewardGuards(date) };
  return state;
}

export function applySparkTransaction(state: EconomyState, input: { id: string; amount: number; reason: SparkReason; idempotencyKey: string; userId: string; createdAt: string; metadata?: Record<string, string> }): EconomyState {
  state = normalizeEconomy(state, input.createdAt.slice(0, 10));
  if (input.userId !== state.wallet.userId || !Number.isInteger(input.amount) || input.amount === 0) return state;
  if (state.fulfilledKeys.includes(input.idempotencyKey)) return state;
  const nextBalance = state.wallet.balance + input.amount;
  if (nextBalance < 0) return state;
  const entry: LedgerEntry = { id: input.id, userId: input.userId, delta: input.amount, balanceAfter: nextBalance, reason: input.reason, idempotencyKey: input.idempotencyKey, createdAt: input.createdAt, metadata: input.metadata };
  const earned = input.amount > 0 ? input.amount : 0;
  const spent = input.amount < 0 ? Math.abs(input.amount) : 0;
  const currentDate = input.createdAt.slice(0, 10);
  const dailyEarned = input.amount > 0
    ? (state.wallet.dailyEarnedDate === currentDate ? state.wallet.dailyEarned : 0) + input.amount
    : (state.wallet.dailyEarnedDate === currentDate ? state.wallet.dailyEarned : 0);
  return {
    ...state,
    wallet: { ...state.wallet, balance: nextBalance, lifetimeEarned: state.wallet.lifetimeEarned + earned, lifetimeSpent: state.wallet.lifetimeSpent + spent, dailyEarned, dailyEarnedDate: currentDate },
    ledger: [entry, ...state.ledger],
    fulfilledKeys: [...state.fulfilledKeys, input.idempotencyKey].slice(-500),
  };
}

export function canEarnDaily(state: EconomyState, amount: number, date: string, dailyCap = DAILY_SPARK_CAP): boolean {
  const earnedToday = state.wallet.dailyEarnedDate === date ? state.wallet.dailyEarned : 0;
  return amount > 0 && earnedToday + amount <= dailyCap;
}

export function canRewardAction(state: EconomyState, input: { action: RewardGuardAction; amount: number; at: string; gameId?: string }): { allowed: boolean; reason?: RewardBlockReason } {
  const date = input.at.slice(0, 10);
  const normalized = normalizeEconomy(state, date);
  if (!canEarnDaily(normalized, input.amount, date, DAILY_SPARK_CAP)) return { allowed: false, reason: "daily_cap" };
  const guards = normalized.rewardGuards;
  if (input.action === "pet") {
    if (guards.petCount >= PET_DAILY_LIMIT) return { allowed: false, reason: "limit" };
    const last = guards.lastRewardedAtByAction.pet ? Date.parse(guards.lastRewardedAtByAction.pet) : null;
    if (last !== null && Number.isFinite(last) && Date.parse(input.at) - last < PET_COOLDOWN_MS) return { allowed: false, reason: "cooldown" };
  }
  if (input.action === "memory" && guards.memoryCount >= MEMORY_DAILY_LIMIT) return { allowed: false, reason: "limit" };
  if (input.action === "play" && guards.rewardedPlayTypes.includes(input.gameId ?? "default")) return { allowed: false, reason: "duplicate_game" };
  return { allowed: true };
}

export function markRewardedAction(state: EconomyState, input: { action: RewardGuardAction; amount: number; at: string; gameId?: string }): EconomyState {
  const date = input.at.slice(0, 10);
  const normalized = normalizeEconomy(state, date);
  const guards = normalized.rewardGuards;
  const nextGuards: RewardGuardState = {
    ...guards,
    petCount: guards.petCount + (input.action === "pet" ? 1 : 0),
    memoryCount: guards.memoryCount + (input.action === "memory" ? 1 : 0),
    rewardedPlayTypes: input.action === "play" ? [...guards.rewardedPlayTypes, input.gameId ?? "default"] : guards.rewardedPlayTypes,
    lastRewardedAtByAction: { ...guards.lastRewardedAtByAction, [input.action]: input.at },
  };
  return { ...normalized, rewardGuards: nextGuards };
}

export function checkinRewardInputs(userId: string, date: string, hasPartnerCheckin: boolean): Array<{ id: string; amount: number; reason: "daily"; idempotencyKey: string; metadata: Record<string, string> }> {
  const rewards = [{ id: `checkin-personal-${userId}-${date}`, amount: 10, reason: "daily" as const, idempotencyKey: `checkin:${userId}:${date}`, metadata: { action: "checkin_personal" } }];
  if (hasPartnerCheckin) rewards.push({ id: `checkin-shared-${userId}-${date}`, amount: 5, reason: "daily" as const, idempotencyKey: `checkin-shared:${userId}:${date}`, metadata: { action: "checkin_shared" } });
  return rewards;
}
