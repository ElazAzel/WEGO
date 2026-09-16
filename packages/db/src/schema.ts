export const tableNames = [
  "users",
  "spaces",
  "space_members",
  "invitations",
  "daily_checkins",
  "story_entries",
  "spark_wallets",
  "spark_ledger",
  "catalog_items",
  "purchases",
  "entitlements",
  "daily_earn_totals",
  "reward_action_guards",
  "world_snapshots",
  "world_memories",
  "sessions",
  "world_commands",
  "shared_plans",
  "pair_game_sessions",
  "foundation_records",
  "change_journal",
] as const;

export type TableName = (typeof tableNames)[number];

/**
 * The migration is kept as the deployable source of truth in /db/migrations.
 * This metadata gives the API and migration tooling one typed package boundary.
 */
export const schemaVersion = 5;

export const sensitiveColumns = [
  "daily_checkins.note_ciphertext",
  "daily_checkins.note_iv",
  "daily_checkins.note_auth_tag",
] as const;
