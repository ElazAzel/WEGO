import type { Change, Store, Transaction } from "./repository";

type Bucket = Map<string, unknown>;

/** Development/test adapter. Production must use PostgresStore. */
export class MemoryStore implements Store {
  private readonly buckets = new Map<string, Bucket>();
  private readonly journal = new Map<string, Change[]>();
  private readonly members: (spaceId: string, userId: string) => boolean;

  constructor(members: (spaceId: string, userId: string) => boolean) { this.members = members; }
  private bucket(collection: string): Bucket { let value = this.buckets.get(collection); if (!value) { value = new Map(); this.buckets.set(collection, value); } return value; }
  async transaction<T>(userId: string, work: (tx: Transaction) => Promise<T>): Promise<T> {
    const staged = new Map<string, Map<string, unknown>>();
    const stagedJournal: Change[] = [];
    const scope = (collection: string) => {
      const match = /^(?:life|receipts|life-commands):(.+)$/.exec(collection);
      if (match && !this.members(match[1]!, userId)) throw new Error("Нет доступа к пространству");
      return match?.[1];
    };
    const copy = (collection: string) => { let map = staged.get(collection); if (!map) { map = new Map(this.bucket(collection)); staged.set(collection, map); } return map; };
    const tx: Transaction = {
      get: async <V>(collection: string, id: string) => { scope(collection); return (copy(collection).get(id) as V | undefined) ?? null; },
      put: async <V>(collection: string, id: string, value: V) => { scope(collection); copy(collection).set(id, structuredClone(value)); },
      delete: async (collection, id) => { scope(collection); copy(collection).delete(id); },
      list: async <V>(collection: string) => { scope(collection); return [...copy(collection).values()] as V[]; },
      append: async (spaceId, type, entityId, revision) => { if (!this.members(spaceId, userId)) throw new Error("Нет доступа к пространству"); stagedJournal.push({ cursor: "", spaceId, type, entityId, revision }); },
    };
    const result = await work(tx);
    for (const [collection, map] of staged) this.buckets.set(collection, map);
    for (const change of stagedJournal) { const list = this.journal.get(change.spaceId) ?? []; list.push({ ...change, cursor: String(list.length + 1) }); this.journal.set(change.spaceId, list); }
    return result;
  }
  async changes(spaceId: string, cursor: string, userId: string) { if (!this.members(spaceId, userId)) throw new Error("Нет доступа к пространству"); const list = this.journal.get(spaceId) ?? []; const after = Number(cursor) || 0; const changes = list.filter(c => Number(c.cursor) > after).slice(0, 500); return { changes, cursor: changes.at(-1)?.cursor ?? cursor }; }
  async ready() {}
  async close() {}
}
