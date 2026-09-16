import { createInitialRewardGuards, type RewardGuardState } from "@wego/domain";

export type RewardGuardRow = {
  user_id: string;
  local_date: string;
  action_type: "pet" | "memory" | "play";
  action_key: string;
  rewarded_at: string;
};

type PersistedRewardGuards = { userId: string; state: RewardGuardState };

export function encodeRewardGuardRows(userId: string, state: RewardGuardState): RewardGuardRow[] {
  const fallbackTimestamp = `${state.date}T00:00:00.000Z`;
  const rows: RewardGuardRow[] = [];
  for (let index = 0; index < state.petCount; index += 1) rows.push({ user_id: userId, local_date: state.date, action_type: "pet", action_key: `pet-${index + 1}`, rewarded_at: state.lastRewardedAtByAction.pet ?? fallbackTimestamp });
  for (let index = 0; index < state.memoryCount; index += 1) rows.push({ user_id: userId, local_date: state.date, action_type: "memory", action_key: `memory-${index + 1}`, rewarded_at: state.lastRewardedAtByAction.memory ?? fallbackTimestamp });
  for (const gameId of state.rewardedPlayTypes) rows.push({ user_id: userId, local_date: state.date, action_type: "play", action_key: gameId, rewarded_at: state.lastRewardedAtByAction.play ?? fallbackTimestamp });
  return rows;
}

export function decodeRewardGuardRows(userId: string, rows: RewardGuardRow[]): PersistedRewardGuards | null {
  const relevant = rows.filter((row) => row.user_id === userId);
  if (relevant.length === 0) return null;
  const date = relevant.map((row) => row.local_date).sort().at(-1)!;
  const state = createInitialRewardGuards(date);
  for (const row of relevant) {
    if (row.local_date !== date) continue;
    if (row.action_type === "pet") state.petCount += 1;
    if (row.action_type === "memory") state.memoryCount += 1;
    if (row.action_type === "play" && !state.rewardedPlayTypes.includes(row.action_key)) state.rewardedPlayTypes.push(row.action_key);
    const current = state.lastRewardedAtByAction[row.action_type];
    if (!current || Date.parse(row.rewarded_at) > Date.parse(current)) state.lastRewardedAtByAction[row.action_type] = row.rewarded_at;
  }
  return { userId, state };
}
