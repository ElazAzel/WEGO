import { describe, expect, it } from "vitest";
import { schemaVersion, sensitiveColumns, tableNames } from "./schema";

describe("database contract", () => {
  it("exposes the current migration tables", () => {
    expect(schemaVersion).toBe(3);
    expect(tableNames).toEqual([
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
    ]);
  });

  it("keeps note storage explicitly classified as sensitive", () => {
    expect(sensitiveColumns).toContain("daily_checkins.note_ciphertext");
  });
});
