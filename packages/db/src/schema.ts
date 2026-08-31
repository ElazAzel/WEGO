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
] as const;

export type TableName = (typeof tableNames)[number];

/**
 * The migration is kept as the deployable source of truth in /db/migrations.
 * This metadata gives the API and migration tooling one typed package boundary.
 */
export const schemaVersion = 3;

export const sensitiveColumns = [
  "daily_checkins.note_ciphertext",
  "daily_checkins.note_iv",
  "daily_checkins.note_auth_tag",
] as const;
