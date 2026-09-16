import { describe, expect, it } from "vitest";
import {
  applySparkTransaction,
  canEarnDaily,
  canRewardAction,
  checkinRewardInputs,
  createInitialEconomy,
  createInitialWorld,
  DAILY_SPARK_CAP,
  markRewardedAction,
  reduceWorld,
  welcomeBackMessage,
} from "../index";

describe("living world reducers", () => {
  it("updates needs and grants an idempotent reward for care", () => {
    const before = createInitialWorld("2026-08-27T10:00:00.000Z");
    const action = { id: "care-1", type: "pet" as const, actorId: "me", objectId: "toy" as const, at: "2026-08-27T10:01:00.000Z" };
    const result = reduceWorld(before, action);
    expect(result.snapshot.needs.connection).toBeGreaterThan(before.needs.connection);
    expect(result.reward?.amount).toBe(4);
    expect(reduceWorld(result.snapshot, action).reward).toBeNull();
  });

  it("does not let a transaction overdraw the wallet", () => {
    const state = createInitialEconomy("me", "2026-08-27");
    const next = applySparkTransaction(state, { id: "spend-1", userId: "me", amount: -121, reason: "purchase", idempotencyKey: "spend-1", createdAt: "2026-08-27T10:00:00.000Z" });
    expect(next.wallet.balance).toBe(120);
    expect(next.ledger).toHaveLength(0);
  });

  it("deduplicates ledger entries and enforces the daily earning cap", () => {
    const state = createInitialEconomy("me", "2026-08-27");
    const input = { id: "care-1", userId: "me", amount: 6, reason: "care" as const, idempotencyKey: "care-1", createdAt: "2026-08-27T10:00:00.000Z" };
    const once = applySparkTransaction(state, input);
    const twice = applySparkTransaction(once, input);
    expect(twice.ledger).toHaveLength(1);
    expect(canEarnDaily({ ...twice, wallet: { ...twice.wallet, dailyEarned: 78 } }, 6, "2026-08-27")).toBe(false);
  });

  it("splits a check-in into a personal reward and a non-punitive shared bonus", () => {
    expect(checkinRewardInputs("me", "2026-08-27", false)).toEqual([
      expect.objectContaining({ amount: 10, idempotencyKey: "checkin:me:2026-08-27" }),
    ]);
    expect(checkinRewardInputs("me", "2026-08-27", true).map((item) => item.amount)).toEqual([10, 5]);
  });

  it("blocks pet farming with a three-per-day limit and a twenty-minute cooldown", () => {
    let state = createInitialEconomy("me", "2026-08-27");
    const first = { action: "pet" as const, amount: 4, at: "2026-08-27T10:00:00.000Z" };
    expect(canRewardAction(state, first).allowed).toBe(true);
    state = markRewardedAction(state, first);
    const tooSoon = { ...first, at: "2026-08-27T10:19:59.000Z" };
    expect(canRewardAction(state, tooSoon)).toMatchObject({ allowed: false, reason: "cooldown" });
    const afterCooldown = { ...first, at: "2026-08-27T10:20:00.000Z" };
    state = markRewardedAction(state, afterCooldown);
    state = markRewardedAction(state, { ...first, at: "2026-08-27T10:40:00.000Z" });
    expect(canRewardAction(state, { ...first, at: "2026-08-27T11:00:00.000Z" })).toMatchObject({ allowed: false, reason: "limit" });
  });

  it("allows a play reward once per game type and caps regular income at 80 Sparks", () => {
    let state = createInitialEconomy("me", "2026-08-27");
    const play = { action: "play" as const, gameId: "cozy-match", amount: 8, at: "2026-08-27T10:00:00.000Z" };
    state = markRewardedAction(state, play);
    expect(canRewardAction(state, play)).toMatchObject({ allowed: false, reason: "duplicate_game" });
    expect(DAILY_SPARK_CAP).toBe(80);
    expect(canRewardAction({ ...state, wallet: { ...state.wallet, dailyEarned: 79 } }, { ...play, gameId: "another-game", amount: 8 })).toMatchObject({ allowed: false, reason: "daily_cap" });
  });

  it("returns a gentle welcome-back message without framing absence as a failure", () => {
    expect(welcomeBackMessage("2026-08-24T10:00:00.000Z", "2026-08-27T10:00:00.000Z")).toContain("снова");
    expect(welcomeBackMessage("2026-08-27T09:00:00.000Z", "2026-08-27T10:00:00.000Z")).toBeNull();
  });
});
