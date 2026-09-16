import type { RewardGuardState } from "@wego/domain";
import { describe, expect, it } from "vitest";
import { decodeRewardGuardRows, encodeRewardGuardRows, type RewardGuardRow } from "./reward-guards";

describe("reward guard persistence", () => {
  it("round-trips daily counts, cooldown timestamp, and one-time game keys", () => {
    const state: RewardGuardState = {
      date: "2026-09-16",
      petCount: 2,
      memoryCount: 1,
      rewardedPlayTypes: ["choose-vibe"],
      lastRewardedAtByAction: {
        pet: "2026-09-16T08:30:00.000Z",
        memory: "2026-09-16T08:35:00.000Z",
        play: "2026-09-16T08:40:00.000Z",
      },
    };

    const rows = encodeRewardGuardRows("tg-42", state);
    const restored = decodeRewardGuardRows("tg-42", rows);

    expect(restored).toEqual({ userId: "tg-42", state });
  });

  it("ignores rows from another user or date", () => {
    const rows: RewardGuardRow[] = [
      { user_id: "tg-other", local_date: "2026-09-16", action_type: "pet", action_key: "pet-1", rewarded_at: "2026-09-16T08:30:00.000Z" },
      { user_id: "tg-42", local_date: "2026-09-15", action_type: "pet", action_key: "pet-1", rewarded_at: "2026-09-15T08:30:00.000Z" },
      { user_id: "tg-42", local_date: "2026-09-16", action_type: "pet", action_key: "pet-1", rewarded_at: "2026-09-16T08:30:00.000Z" },
    ];

    expect(decodeRewardGuardRows("tg-42", rows)).toEqual({
      userId: "tg-42",
      state: {
        date: "2026-09-16",
        petCount: 1,
        memoryCount: 0,
        rewardedPlayTypes: [],
        lastRewardedAtByAction: { pet: "2026-09-16T08:30:00.000Z" },
      },
    });
  });
});
