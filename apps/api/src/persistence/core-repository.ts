import { createHash } from "node:crypto";
import type { LedgerEntry, SparkWallet, WorldSnapshot } from "@wego/domain";
import type { RegionTier } from "../modules/billing/regional-pricing";
import type { EncryptedNote } from "../security/crypto";
import type { SqlPool } from "./postgres";

export type PersistedUser = { id: string; telegramId: number; name: string; tone: "coral" | "lilac"; regionTier: RegionTier };
export type PersistedSpace = { id: string; name: string; type: "pair" | "friends" | "family"; stage: "egg" | "baby" | "adult"; character: string; daysAlive: number; style: "a" | "b"; room: "warm" | "morning"; timezone: string; members: string[]; inviteHash?: string; inviteExpiresAt?: string };
export type PersistedCheckin = { date: string; userId: string; mood: string; energy: string; want: string; note: EncryptedNote | null; guess: string | null; revealed: boolean; clientMutationId?: string };
export type PersistedStory = { id: string; sourceType: string; sourceId: string; date: string; type: string; title: string; body: string; tone: string };
export type PersistedSession = { userId: string; expiresAt: number };
export type PersistedWorld = { spaceId: string; world: WorldSnapshot; revision: number };

export type CoreHydration = {
  users: PersistedUser[];
  spaces: PersistedSpace[];
  checkins: PersistedCheckin[];
  stories: PersistedStory[];
  planned: Array<{ spaceId: string; activityIds: string[] }>;
  sessions?: Array<{ tokenHash: string; userId: string; expiresAt: number }>;
  wallets: SparkWallet[];
  ledgers: LedgerEntry[];
  worlds: PersistedWorld[];
};

export interface CoreRepository {
  session(token: string): Promise<PersistedSession | null>;
  hydrateUser(userId: string): Promise<CoreHydration>;
  hydrateInvite(token: string): Promise<CoreHydration>;
  saveSession(token: string, userId: string, expiresAt: number): Promise<void>;
  deleteSession(token: string): Promise<void>;
  persist(snapshot: CoreHydration): Promise<void>;
  close(): Promise<void>;
}

const emptyHydration = (): CoreHydration => ({ users: [], spaces: [], checkins: [], stories: [], planned: [], wallets: [], ledgers: [], worlds: [] });
const tokenHash = (token: string): string => createHash("sha256").update(token).digest("hex");

export class MemoryCoreRepository implements CoreRepository {
  async session(): Promise<PersistedSession | null> { return null; }
  async hydrateUser(): Promise<CoreHydration> { return emptyHydration(); }
  async hydrateInvite(): Promise<CoreHydration> { return emptyHydration(); }
  async saveSession(): Promise<void> {}
  async deleteSession(): Promise<void> {}
  async persist(): Promise<void> {}
  async close(): Promise<void> {}
}

export class PostgresCoreRepository implements CoreRepository {
  constructor(private readonly pool: SqlPool) {}

  async session(token: string): Promise<PersistedSession | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query<{ user_id: string; expires_at: string }>("select user_id, extract(epoch from expires_at) * 1000 as expires_at from sessions where token_hash=$1 and expires_at > now()", [tokenHash(token)]);
      const row = result.rows[0];
      return row ? { userId: row.user_id, expiresAt: Number(row.expires_at) } : null;
    } finally { client.release?.(); }
  }

  async saveSession(token: string, userId: string, expiresAt: number): Promise<void> {
    const client = await this.pool.connect();
    try { await client.query("insert into sessions(token_hash,user_id,expires_at) values ($1,$2,to_timestamp($3 / 1000.0)) on conflict (token_hash) do update set user_id=excluded.user_id, expires_at=excluded.expires_at, last_seen_at=now()", [tokenHash(token), userId, expiresAt]); } finally { client.release?.(); }
  }

  async deleteSession(token: string): Promise<void> {
    const client = await this.pool.connect();
    try { await client.query("delete from sessions where token_hash=$1", [tokenHash(token)]); } finally { client.release?.(); }
  }

  async hydrateUser(userId: string): Promise<CoreHydration> {
    const client = await this.pool.connect();
    try {
      const user = await client.query<PersistedUser>("select id, telegram_id as \"telegramId\", display_name as name, tone, region_tier as \"regionTier\" from users where id=$1", [userId]);
      const spaces = await client.query<DbSpace>("select s.id,s.name,s.type,s.stage,s.character_name,s.days_alive,s.style,s.room,s.timezone,array_agg(m.user_id order by m.joined_at) as members from spaces s join space_members m on m.space_id=s.id where s.id in (select space_id from space_members where user_id=$1) group by s.id", [userId]);
      return this.hydrateForSpaceRows(client, user.rows, spaces.rows);
    } finally { client.release?.(); }
  }

  async hydrateInvite(token: string): Promise<CoreHydration> {
    const client = await this.pool.connect();
    try {
      const invitation = await client.query<{ space_id: string }>("select space_id from invitations where token_hash=$1 and accepted_by is null and expires_at > now()", [tokenHash(token)]);
      if (!invitation.rows[0]) return emptyHydration();
      const spaces = await client.query<DbSpace>("select s.id,s.name,s.type,s.stage,s.character_name,s.days_alive,s.style,s.room,s.timezone,array_agg(m.user_id order by m.joined_at) as members from spaces s join space_members m on m.space_id=s.id where s.id=$1 group by s.id", [invitation.rows[0].space_id]);
      return this.hydrateForSpaceRows(client, [], spaces.rows);
    } finally { client.release?.(); }
  }

  private async hydrateForSpaceRows(client: Awaited<ReturnType<SqlPool["connect"]>>, users: PersistedUser[], rows: DbSpace[]): Promise<CoreHydration> {
    if (rows.length === 0) return { ...emptyHydration(), users };
    const spaceIds = rows.map((row) => row.id);
    const memberIds = [...new Set(rows.flatMap((row) => row.members))];
    const [members, invitations, checkins, stories, planned, wallets, ledgers, worlds] = await Promise.all([
      client.query<PersistedUser>("select id, telegram_id as \"telegramId\", display_name as name, tone, region_tier as \"regionTier\" from users where id = any($1::text[])", [memberIds]),
      client.query<{ space_id: string; token_hash: string; expires_at: string }>("select distinct on (space_id) space_id, token_hash, expires_at from invitations where space_id = any($1::text[]) and accepted_by is null and expires_at > now() order by space_id, created_at desc", [spaceIds]),
      client.query<DbCheckin>("select local_date::text as date,user_id,mood,energy,want,note_ciphertext,note_iv,note_auth_tag,guess,revealed_at,client_mutation_id from daily_checkins where space_id = any($1::text[])", [spaceIds]),
      client.query<DbStory>("select id,space_id,source_type,source_id,local_date::text as date,type,title,body,tone from story_entries where space_id = any($1::text[]) order by created_at desc", [spaceIds]),
      client.query<{ space_id: string; activity_id: string }>("select space_id,activity_id from planned_activities where space_id = any($1::text[])", [spaceIds]),
      client.query<SparkWallet>("select user_id as \"userId\",balance,lifetime_earned as \"lifetimeEarned\",lifetime_spent as \"lifetimeSpent\",daily_earned as \"dailyEarned\",daily_earned_date::text as \"dailyEarnedDate\" from spark_wallets where user_id = any($1::text[])", [memberIds]),
      client.query<LedgerEntry>("select id,user_id as \"userId\",delta,balance_after as \"balanceAfter\",reason,idempotency_key as \"idempotencyKey\",created_at as \"createdAt\",metadata from spark_ledger where user_id = any($1::text[]) order by created_at desc limit 1000", [memberIds]),
      client.query<{ space_id: string; version: number; snapshot: WorldSnapshot }>("select space_id,version,snapshot from world_snapshots where space_id = any($1::text[])", [spaceIds]),
    ]);
    const allUsers = [...users, ...members.rows].filter((user, index, list) => list.findIndex((item) => item.id === user.id) === index);
    const inviteBySpace = new Map(invitations.rows.map((invite) => [invite.space_id, invite]));
    return {
      users: allUsers,
      spaces: rows.map((row) => ({ id: row.id, name: row.name, type: row.type, stage: row.stage, character: row.character_name, daysAlive: row.days_alive, style: row.style, room: row.room, timezone: row.timezone, members: row.members, ...(inviteBySpace.has(row.id) ? { inviteHash: inviteBySpace.get(row.id)!.token_hash, inviteExpiresAt: new Date(inviteBySpace.get(row.id)!.expires_at).toISOString() } : {}) })),
      checkins: checkins.rows.map((item) => ({ date: item.date, userId: item.user_id, mood: item.mood, energy: item.energy, want: item.want, note: item.note_ciphertext ? { ciphertext: item.note_ciphertext, iv: item.note_iv ?? "", authTag: item.note_auth_tag ?? "", keyVersion: 1 } : null, guess: item.guess, revealed: Boolean(item.revealed_at), clientMutationId: item.client_mutation_id })),
      stories: stories.rows.map((item) => ({ id: item.id, sourceType: item.source_type, sourceId: item.source_id, date: item.date, type: item.type, title: item.title, body: item.body, tone: item.tone })),
      planned: spaceIds.map((spaceId) => ({ spaceId, activityIds: planned.rows.filter((item) => item.space_id === spaceId).map((item) => item.activity_id) })),
      wallets: wallets.rows,
      ledgers: ledgers.rows,
      worlds: worlds.rows.map((item) => ({ spaceId: item.space_id, revision: item.version, world: item.snapshot })),
    };
  }

  async persist(snapshot: CoreHydration): Promise<void> {
    if (snapshot.users.length === 0 && snapshot.spaces.length === 0) return;
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      for (const user of snapshot.users) await client.query("insert into users(id,telegram_id,display_name,tone,region_tier) values ($1,$2,$3,$4,$5) on conflict (id) do update set display_name=excluded.display_name,tone=excluded.tone,region_tier=excluded.region_tier,updated_at=now()", [user.id, user.telegramId, user.name, user.tone, user.regionTier]);
      for (const space of snapshot.spaces) {
        await client.query("insert into spaces(id,name,type,style,stage,character_name,room,timezone,days_alive) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do update set name=excluded.name,type=excluded.type,style=excluded.style,stage=excluded.stage,character_name=excluded.character_name,room=excluded.room,timezone=excluded.timezone,days_alive=excluded.days_alive,updated_at=now()", [space.id, space.name, space.type, space.style, space.stage, space.character, space.room, space.timezone, space.daysAlive]);
        for (const memberId of space.members) await client.query("insert into space_members(space_id,user_id) values ($1,$2) on conflict do nothing", [space.id, memberId]);
        if (space.inviteHash && space.inviteExpiresAt) await client.query("insert into invitations(id,space_id,created_by,token_hash,expires_at) values ($1,$2,$3,$4,$5) on conflict (id) do update set token_hash=excluded.token_hash,expires_at=excluded.expires_at,accepted_by=null,accepted_at=null", [`invite-${space.id}-${space.inviteHash.slice(0, 12)}`, space.id, space.members[0], space.inviteHash, space.inviteExpiresAt]);
        else if (space.members.length > 1) await client.query("update invitations set accepted_by=$2,accepted_at=coalesce(accepted_at,now()) where space_id=$1 and accepted_by is null", [space.id, space.members[1]]);
      }
      for (const checkin of snapshot.checkins) {
        const space = snapshot.spaces.find((item) => item.members.includes(checkin.userId));
        if (!space) continue;
        await client.query("insert into daily_checkins(id,space_id,local_date,user_id,mood,energy,want,note_ciphertext,note_iv,note_auth_tag,guess,revealed_at,client_mutation_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (space_id,local_date,user_id) do update set mood=excluded.mood,energy=excluded.energy,want=excluded.want,note_ciphertext=excluded.note_ciphertext,note_iv=excluded.note_iv,note_auth_tag=excluded.note_auth_tag,guess=excluded.guess,revealed_at=excluded.revealed_at,client_mutation_id=excluded.client_mutation_id,updated_at=now()", [`checkin-${checkin.userId}-${checkin.date}`, space.id, checkin.date, checkin.userId, checkin.mood, checkin.energy, checkin.want, checkin.note?.ciphertext ?? null, checkin.note?.iv ?? null, checkin.note?.authTag ?? null, checkin.guess, checkin.revealed ? new Date() : null, checkin.clientMutationId ?? `legacy-${checkin.userId}-${checkin.date}`]);
      }
      for (const story of snapshot.stories) {
        const space = snapshot.spaces.find((item) => story.sourceId.startsWith(item.id));
        if (space) await client.query("insert into story_entries(id,space_id,source_type,source_id,local_date,type,title,body,tone) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (space_id,source_type,source_id) do nothing", [story.id, space.id, story.sourceType, story.sourceId, story.date, story.type, story.title, story.body, story.tone]);
      }
      for (const wallet of snapshot.wallets) await client.query("insert into spark_wallets(user_id,balance,lifetime_earned,lifetime_spent,daily_earned,daily_earned_date) values ($1,$2,$3,$4,$5,$6) on conflict (user_id) do update set balance=excluded.balance,lifetime_earned=excluded.lifetime_earned,lifetime_spent=excluded.lifetime_spent,daily_earned=excluded.daily_earned,daily_earned_date=excluded.daily_earned_date", [wallet.userId, wallet.balance, wallet.lifetimeEarned, wallet.lifetimeSpent, wallet.dailyEarned, wallet.dailyEarnedDate]);
      for (const ledger of snapshot.ledgers) await client.query("insert into spark_ledger(id,user_id,delta,balance_after,reason,idempotency_key,metadata,created_at) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing", [ledger.id, ledger.userId, ledger.delta, ledger.balanceAfter, ledger.reason, ledger.idempotencyKey, JSON.stringify(ledger.metadata ?? {}), ledger.createdAt]);
      for (const world of snapshot.worlds) await client.query("insert into world_snapshots(space_id,version,snapshot) values ($1,$2,$3) on conflict (space_id) do update set version=excluded.version,snapshot=excluded.snapshot,updated_at=now()", [world.spaceId, world.revision, JSON.stringify(world.world)]);
      await client.query("commit");
    } catch (error) { await client.query("rollback").catch(() => undefined); throw error; } finally { client.release?.(); }
  }

  async close(): Promise<void> {}
}

type DbSpace = { id: string; name: string; type: PersistedSpace["type"]; stage: PersistedSpace["stage"]; character_name: string; days_alive: number; style: PersistedSpace["style"]; room: PersistedSpace["room"]; timezone: string; members: string[] };
type DbCheckin = { date: string; user_id: string; mood: string; energy: string; want: string; note_ciphertext: string | null; note_iv: string | null; note_auth_tag: string | null; guess: string | null; revealed_at: string | null; client_mutation_id: string };
type DbStory = { id: string; space_id: string; source_type: string; source_id: string; date: string; type: string; title: string; body: string; tone: string };
