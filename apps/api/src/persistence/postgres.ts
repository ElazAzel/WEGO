import type { Change, Store, Transaction } from "./repository";

export type SqlResult = { rows: any[]; rowCount?: number };
export type SqlClient = { query<T = any>(text: string, values?: unknown[]): Promise<SqlResult & { rows: T[] }>; release?: () => void };
export type SqlPool = { connect(): Promise<SqlClient>; end(): Promise<void> };

/** Postgres adapter is intentionally expressed against a small structural client so the API can bundle pg at deployment. */
export class PostgresStore implements Store {
  constructor(private readonly pool: SqlPool) {}
  async transaction<T>(userId: string, work: (tx: Transaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("select set_config('wego.user_id', $1, true)", [userId]);
      const tx: Transaction = {
        get: async <V>(collection: string, id: string) => { const result = await client.query<{ value: V }>("select value from foundation_records where collection=$1 and id=$2", [collection, id]); return result.rows[0]?.value ?? null; },
        put: async <V>(collection: string, id: string, value: V) => { const match = /^(?:life|receipts|life-commands):(.+)$/.exec(collection); await client.query("insert into foundation_records(collection,id,scope_kind,scope_id,value) values ($1,$2,$3,$4,$5::jsonb) on conflict (collection,id) do update set value=excluded.value, updated_at=now()", [collection, id, match ? "space" : "user", match?.[1] ?? userId, JSON.stringify(value)]); },
        delete: async (collection: string, id: string) => { await client.query("delete from foundation_records where collection=$1 and id=$2", [collection, id]); },
        list: async <V>(collection: string) => { const result = await client.query<{ value: V }>("select value from foundation_records where collection=$1 order by id", [collection]); return result.rows.map(row => row.value); },
        append: async (spaceId, type, entityId, revision) => { await client.query("insert into change_journal(space_id,type,entity_id,revision) values ($1,$2,$3,$4)", [spaceId, type, entityId, revision]); },
      };
      const result = await work(tx);
      await client.query("COMMIT");
      return result;
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; } finally { client.release?.(); }
  }
  async changes(spaceId: string, cursor: string, userId: string) {
    const result = await this.pool.connect();
    try { await result.query("select set_config('wego.user_id', $1, true)", [userId]); const rows = await result.query<Change>("select cursor::text,space_id as \"spaceId\",type,entity_id as \"entityId\",revision from change_journal where space_id=$1 and cursor>$2 order by cursor limit 500", [spaceId, cursor]); return { changes: rows.rows, cursor: rows.rows.at(-1)?.cursor ?? cursor }; } finally { result.release?.(); }
  }
  async ready() { const client = await this.pool.connect(); try { await client.query("select 1"); } finally { client.release?.(); } }
  async close() { await this.pool.end(); }
}
