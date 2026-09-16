import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Embedded PostgreSQL is optional; the controller owns dependency installation.
const require = createRequire(import.meta.url);
let pglitePath: string | undefined;
try { pglitePath = require.resolve("@electric-sql/pglite"); } catch { /* explicit skip below */ }

describe.skipIf(!pglitePath)("foundation SQL / RLS integration (PGlite, not production pg-boss)", () => {
  let db: any, store: any;
  beforeAll(async () => {
    const packageName = "@electric-sql/pglite";
    const { PGlite } = await import(/* @vite-ignore */ packageName);
    db = new PGlite();
    await db.exec(await readFile(new URL("../../../../packages/db/migrations/0001_core.sql", import.meta.url), "utf8"));
    await db.exec("create role wego_app");
    await db.exec(await readFile(new URL("../../../../packages/db/migrations/0005_foundation.sql", import.meta.url), "utf8"));
    await db.exec(`
      insert into users(id, telegram_id, display_name) values
        ('alice', 1001, 'Alice'), ('bob', 1002, 'Bob');
      insert into spaces(id, name, type) values
        ('pair-a', 'Pair A', 'pair'), ('pair-b', 'Pair B', 'pair');
      insert into space_members(space_id, user_id) values
        ('pair-a', 'alice'), ('pair-b', 'bob');
    `);
    const { PostgresStore } = await import("./postgres");
    // The SQL implementation receives a real SQL client. PGlite has one connection.
    store = new PostgresStore({
      connect: async () => ({ query: (sql: string, values?: unknown[]) => db.query(sql, values), release() {} }),
      end: async () => {},
    });
    await store.transaction("$system", async (tx: any) => {
      await tx.put("users", "alice", {id:"alice"});
      await tx.put("users", "bob", {id:"bob"});
      await tx.put("memberships", "alice", { spaceId:"pair-a", slot:1 });
      await tx.put("memberships", "bob", { spaceId:"pair-b", slot:1 });
      await tx.put("spaces", "pair-a", {id:"pair-a",members:["alice"]});
      await tx.put("spaces", "pair-b", {id:"pair-b",members:["bob"]});
    });
  }, 60000);
  afterAll(async () => { await db?.close(); });

  it("persists independent records and receipts atomically", async () => {
    await store.transaction("alice", async (tx:any) => {
      await tx.put("life:pair-a","one",{id:"one",privateText:"secret"});
      await tx.put("life-commands:pair-a","command-1",{revision:1});
      await tx.append("pair-a","changed","one",1);
    });
    expect(await store.transaction("alice",(tx:any)=>tx.get("life:pair-a","one"))).toEqual({id:"one",privateText:"secret"});
    await expect(store.transaction("alice", async(tx:any) => {
      await tx.put("life:pair-a","two",{id:"two"});
      await tx.append("pair-a","changed","two",2);
      throw new Error("abort");
    })).rejects.toThrow("abort");
    expect(await store.transaction("alice",(tx:any)=>tx.get("life:pair-a","two"))).toBeNull();
    expect(await store.changes("pair-a","0","alice")).toEqual({ changes:[{cursor:"1",spaceId:"pair-a",type:"changed",entityId:"one",revision:1}],cursor:"1" });
  });

  it("enforces RLS independently of repository membership checks", async () => {
    await db.exec("BEGIN; SET LOCAL ROLE wego_app; SELECT set_config('wego.user_id','bob',true)");
    try {
      const rows = await db.query("SELECT value FROM foundation_records WHERE collection='life:pair-a'");
      expect(rows.rows).toHaveLength(0);
      await expect(db.query("INSERT INTO foundation_records(collection,id,scope_kind,scope_id,value) VALUES ('life:pair-a','intrusion','space','pair-a','{}')")).rejects.toThrow();
    } finally { await db.exec("ROLLBACK"); }
  });

  it("prevents forged scope labels from bypassing RLS", async () => {
    await db.exec("BEGIN; SET LOCAL ROLE wego_app; SELECT set_config('wego.user_id','bob',true)");
    try {
      await expect(db.query("INSERT INTO foundation_records(collection,id,scope_kind,scope_id,value) VALUES ('life:pair-a','forged','space','pair-b','{}')")).rejects.toThrow();
    } finally { await db.exec("ROLLBACK"); }
  });

  it("checks readiness under the non-bypass runtime role", async () => {
    await expect(store.ready()).resolves.toBeUndefined();
  });
});
