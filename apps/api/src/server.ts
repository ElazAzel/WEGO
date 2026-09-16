import Fastify from "fastify";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { z } from "zod";
import { config } from "./config";
import { errorBody, ApiError } from "./errors";
import { validateTelegramInitData } from "./telegram-auth";
import { SpaceEventHub } from "./realtime/sse";
import { decryptNote, encryptNote, type EncryptedNote } from "./security/crypto";
import { WegoActionSchema, canEquipItem, createInitialWorld, normalizeWorld, reduceWorld, roomSlots } from "@wego/domain";
import type { MoodId, EnergyId, WantId, SpaceType, WegoStage, SparkWallet, LedgerEntry, Purchase, Entitlement, SparkReason, WorldSnapshot } from "@wego/domain";
import { catalog, catalogItem } from "./modules/billing/catalog";
import { createStarsInvoiceLink, starsPurchasePayload } from "./modules/billing/telegram-stars";
import { hasValidWebhookSecret, successfulPaymentFrom, type TelegramPaymentUpdate } from "./modules/billing/telegram-webhook";
import { resolveRegionTier, resolveStarsPrice, type RegionTier } from "./modules/billing/regional-pricing";
import { InMemoryWorldState } from "./world/world-state";
import { MemoryStore } from "./persistence/memory";
import type { Store } from "./persistence/repository";
import { registerLifeRoutes } from "./modules/life/routes";
import { registerNotificationRoutes } from "./modules/notifications/routes";
import { PostgresStore } from "./persistence/postgres";

type User = { id: string; telegramId: number; name: string; tone: "coral" | "lilac"; regionTier: RegionTier };
type Space = { id: string; name: string; type: SpaceType; stage: WegoStage; character: string; daysAlive: number; style: "a" | "b"; room: "warm" | "morning"; timezone: string; members: string[]; inviteHash?: string; inviteExpiresAt?: string };
type Checkin = { date: string; userId: string; mood: MoodId; energy: EnergyId; want: WantId; note: EncryptedNote | null; guess: MoodId | null; revealed: boolean };
type Story = { id: string; sourceType: string; sourceId: string; date: string; type: string; title: string; body: string; tone: string };

const users = new Map<string, User>(); const spaces = new Map<string, Space>(); const checkins = new Map<string, Checkin>(); const sessions = new Map<string, { userId: string; expiresAt: number; serverId: string }>(); const stories = new Map<string, Story>(); const planned = new Map<string, Set<string>>(); const wallets = new Map<string, SparkWallet>(); const sparkLedgers = new Map<string, LedgerEntry[]>(); const purchases = new Map<string, Purchase>(); const entitlements = new Map<string, Entitlement>();
let runtimeNow = () => new Date();
const createSpaceSchema = z.object({ name: z.string().trim().min(1).max(24), type: z.enum(["pair", "friends", "family"]), style: z.enum(["a", "b"]).default("a"), timezone: z.string().default("Asia/Almaty") });
const checkinSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mood: z.enum(["great", "good", "calm", "normal", "overloaded", "hard", "irritated"]), energy: z.enum(["high", "mid", "low"]), want: z.enum(["together", "talk", "rest", "alone", "fun", "walk", "support"]), note: z.string().max(240), clientMutationId: z.string().min(1) });
const invoiceSchema = z.object({ itemId: z.string().min(1), spaceId: z.string().nullable().optional(), recipientUserId: z.string().min(1).nullable().optional() });
const equipmentSchema = z.object({ commandId: z.string().min(1).max(120), expectedRevision: z.number().int().nonnegative(), equippedRoomItems: z.record(z.string().nullable()).optional(), equippedWegoItems: z.object({ outfit: z.string().min(1), accessory: z.string().min(1).nullable(), emotion: z.string().min(1).nullable() }).optional() });
const worldCommandSchema = z.object({ commandId: z.string().min(1).max(120), expectedRevision: z.number().int().nonnegative(), action: WegoActionSchema.omit({ id: true, actorId: true }) });

function cookieValue(header: string, name: string): string | null { try { const match = header.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`)); return match ? decodeURIComponent(match.slice(name.length + 1)) : null; } catch { return null; } }
function userFromRequest(request: { headers: Record<string, string | string[] | undefined>; __wegoServerId?: string }): User { const cookieToken = cookieValue(String(request.headers.cookie ?? ""), "wego_session"); const bearerToken = String(request.headers.authorization ?? "").replace(/^Bearer /, ""); const token = cookieToken ?? bearerToken; const session = sessions.get(token); if (!session || (request.__wegoServerId && session.serverId !== request.__wegoServerId) || session.expiresAt <= runtimeNow().getTime()) { if (token) sessions.delete(token); throw new ApiError(401, "UNAUTHENTICATED", "Сессия устарела"); } const user = users.get(session.userId); if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Сессия устарела"); return user; }
function spaceForUser(spaceId: string, userId: string): Space { const space = spaces.get(spaceId); if (!space) throw new ApiError(404, "SPACE_NOT_FOUND", "Пространство не найдено"); if (!space.members.includes(userId)) throw new ApiError(403, "FORBIDDEN", "Нет доступа к пространству"); return space; }
function localDate(space: Space): string { return new Intl.DateTimeFormat("en-CA", { timeZone: space.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function noteText(note: EncryptedNote | null): string | null { return note ? decryptNote(note, config.noteEncryptionKey) : null; }
function ownCheckinView(checkin: Checkin) { return { date: checkin.date, mood: checkin.mood, energy: checkin.energy, want: checkin.want, note: noteText(checkin.note), guess: checkin.guess, revealed: checkin.revealed }; }
function partnerCheckinView(checkin: Checkin, revealed: boolean) { return { date: checkin.date, mood: checkin.mood, energy: checkin.energy, want: checkin.want, ...(revealed ? { note: noteText(checkin.note) } : {}) }; }
function walletForUser(userId: string): SparkWallet { const date = new Date().toISOString().slice(0, 10); const existing = wallets.get(userId); if (existing) return existing; const wallet: SparkWallet = { userId, balance: 120, lifetimeEarned: 120, lifetimeSpent: 0, dailyEarned: 0, dailyEarnedDate: date }; wallets.set(userId, wallet); return wallet; }
function activeSpaceForUser(userId: string): Space | null { return Array.from(spaces.values()).find((space) => space.members.includes(userId)) ?? null; }
function worldKeyForUser(userId: string): string { return activeSpaceForUser(userId)?.id ?? userId; }
function worldForUser(userId: string, state: InMemoryWorldState): WorldSnapshot { return state.read(worldKeyForUser(userId)).world; }
function grantWorldItem(userId: string, spaceId: string | null, itemId: string, state: InMemoryWorldState): void { const key = spaceId ?? userId; const world = state.read(key).world; if (world.unlockedItemIds.includes(itemId)) return; state.replace(key, { ...world, unlockedItemIds: [...world.unlockedItemIds, itemId], updatedAt: new Date().toISOString() }); }
function creditSparks(userId: string, amount: number, reason: SparkReason, idempotencyKey: string, metadata: Record<string, string>, countTowardsDailyCap = true): boolean {
  if (!Number.isInteger(amount) || amount <= 0) return false;
  const ledger = sparkLedgers.get(userId) ?? [];
  if (ledger.some((entry) => entry.idempotencyKey === idempotencyKey)) return false;
  const wallet = walletForUser(userId);
  const date = new Date().toISOString().slice(0, 10);
  if (wallet.dailyEarnedDate !== date) { wallet.dailyEarned = 0; wallet.dailyEarnedDate = date; }
  if (countTowardsDailyCap && wallet.dailyEarned + amount > 80) return false;
  wallet.balance += amount; wallet.lifetimeEarned += amount; if (countTowardsDailyCap) wallet.dailyEarned += amount;
  const entry: LedgerEntry = { id: randomUUID(), userId, delta: amount, balanceAfter: wallet.balance, reason, idempotencyKey, createdAt: new Date().toISOString(), metadata };
  sparkLedgers.set(userId, [entry, ...ledger].slice(0, 500));
  return true;
}

export type BuildServerOptions = { demo?: boolean; now?: () => Date; sessionTtlMs?: number; registerModules?: (app: ReturnType<typeof Fastify>, context: { store: Store; userId: (request: unknown) => string; requireSpace: (tx: unknown, spaceId: string, userId: string) => Promise<Space> }) => void };

export function buildServer(options: BuildServerOptions = {}) {
  for (const map of [users, spaces, checkins, sessions, stories, planned, wallets, sparkLedgers, purchases, entitlements]) map.clear();
  runtimeNow = options.now ?? (() => new Date());
  const nodeEnv = process.env.NODE_ENV ?? config.nodeEnv;
  const demo = options.demo ?? nodeEnv !== "production";
  if (nodeEnv === "production") for (const [name, value] of Object.entries({ DATABASE_URL: process.env.DATABASE_URL, TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN, NOTE_ENCRYPTION_KEY: process.env.NOTE_ENCRYPTION_KEY, TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET, WEB_ORIGIN: process.env.WEB_ORIGIN })) if (!value) throw new Error(`${name} is required in production`);
  if (process.env.NOTE_ENCRYPTION_KEY && config.noteEncryptionKey === Buffer.alloc(32, 7).toString("base64") && process.env.NOTE_ENCRYPTION_KEY.length < 40) throw new Error("NOTE_ENCRYPTION_KEY must be a base64-encoded 32 byte key");
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024, genReqId: () => randomUUID() });
  const serverId = randomUUID();
  app.addHook("onRequest", async (request, reply) => {
    (request as unknown as { __wegoServerId?: string }).__wegoServerId = serverId;
    const origin = String(request.headers.origin ?? "");
    const allowedOrigin = config.webOrigin;
    if (origin && allowedOrigin && origin === allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", origin);
      reply.header("Access-Control-Allow-Credentials", "true");
      reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      reply.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      reply.header("Vary", "Origin");
    }
    if (request.method === "OPTIONS") return reply.code(204).send();
  });
  const eventHub = new SpaceEventHub();
  const worldState = new InMemoryWorldState();
  let store: Store;
  if (nodeEnv !== "production") store = new MemoryStore((spaceId, userId) => spaces.get(spaceId)?.members.includes(userId) ?? false);
  else {
    const require = createRequire(`${process.cwd()}/package.json`);
    let Pool: any;
    try { Pool = require("pg").Pool; } catch { throw new Error("pg package is required for production DATABASE_URL"); }
    store = new PostgresStore(new Pool({ connectionString: process.env.DATABASE_URL, max: 10, statement_timeout: 10000 }));
    app.addHook("onClose", async () => store.close());
  }
  app.setErrorHandler((error, request, reply) => { request.log.error({ err: error }); if (error instanceof z.ZodError) { reply.status(422).send(errorBody(new ApiError(422, "VALIDATION_ERROR", "Проверьте данные формы"), request.id, error.flatten())); return; } reply.status(error instanceof ApiError ? error.statusCode : 500).send(errorBody(error, request.id, error instanceof ApiError ? error.details : undefined)); });
  app.get("/healthz", async () => ({ ok: true }));
  app.get("/readyz", async () => {
    await store.ready();
    return { ok: true, database: nodeEnv === "production" ? "postgres" : "memory-dev-adapter" };
  });
  app.post("/v1/auth/telegram", async (request, reply) => { const body = z.object({ initData: z.string().default("") }).parse(request.body); if (!body.initData && !demo) throw new ApiError(401, "TELEGRAM_INIT_DATA_REQUIRED", "Откройте WEGO из Telegram"); let telegramUser: { id: number; first_name: string; language_code?: string } = { id: 0, first_name: "Локальный пользователь", language_code: "en" }; if (body.initData) { try { telegramUser = validateTelegramInitData(body.initData, config.botToken); } catch { throw new ApiError(401, "INVALID_TELEGRAM_INIT_DATA", "Не удалось подтвердить Telegram"); } } const id = `tg-${telegramUser.id}`; const user = users.get(id) ?? { id, telegramId: telegramUser.id, name: telegramUser.first_name, tone: "coral" as const, regionTier: resolveRegionTier(telegramUser.language_code) }; user.regionTier = resolveRegionTier(telegramUser.language_code); users.set(id, user); const token = randomBytes(24).toString("hex"); const expiresAt = runtimeNow().getTime() + (options.sessionTtlMs ?? 30 * 86400000); sessions.set(token, { userId: id, expiresAt, serverId }); const secure = nodeEnv === "production" ? "; Secure" : ""; const sameSite = nodeEnv === "production" ? "None" : "Lax"; reply.header("Set-Cookie", `wego_session=${encodeURIComponent(token)}; HttpOnly; SameSite=${sameSite}; Path=/; Max-Age=${Math.floor((expiresAt - runtimeNow().getTime()) / 1000)}${secure}`).send({ user, token }); });
  app.post("/v1/auth/logout", async (request, reply) => { userFromRequest(request as never); const token = cookieValue(String(request.headers.cookie ?? ""), "wego_session") ?? String(request.headers.authorization ?? "").replace(/^Bearer /, ""); sessions.delete(token); return reply.header("Set-Cookie", "wego_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0").send({ ok: true }); });
  app.addHook("preHandler", async (request) => { if (request.url.startsWith("/v1/") && !request.url.startsWith("/v1/auth/telegram") && !request.url.startsWith("/v1/telegram/webhook")) userFromRequest(request as never); });
  app.get("/v1/bootstrap", async (request) => { const user = userFromRequest(request as never); const activeSpace = activeSpaceForUser(user.id); const partnerId = activeSpace?.members.find((id) => id !== user.id); const partner = partnerId ? users.get(partnerId) ?? null : null; const record = worldState.read(worldKeyForUser(user.id)); return { user, activeSpace, partner, world: record.world, worldRevision: record.revision }; });
  app.get("/v1/catalog", async (request) => { const user = userFromRequest(request as never); return { regionTier: user.regionTier, items: catalog.map((item) => ({ ...item, starsPrice: resolveStarsPrice(item, user.regionTier) })) }; });
  app.get("/v1/wallet", async (request) => { const user = userFromRequest(request as never); return { wallet: walletForUser(user.id), ledger: sparkLedgers.get(user.id) ?? [], entitlements: Array.from(entitlements.values()).filter((item) => item.userId === user.id), world: worldForUser(user.id, worldState) }; });
  app.get("/v1/world", async (request) => { const user = userFromRequest(request as never); return worldState.read(worldKeyForUser(user.id)); });
  app.put("/v1/world/equipment", async (request) => { const user = userFromRequest(request as never); const input = equipmentSchema.parse(request.body); const current = worldForUser(user.id, worldState); const roomItems = { ...current.equippedRoomItems, ...(input.equippedRoomItems ?? {}) } as WorldSnapshot["equippedRoomItems"]; for (const [slot, itemId] of Object.entries(roomItems)) { if (!roomSlots.includes(slot as never)) throw new ApiError(422, "INVALID_EQUIPMENT_SLOT", "Неизвестный слот комнаты"); if (itemId && (!current.unlockedItemIds.includes(itemId) || !canEquipItem(itemId, { type: "room", slot: slot as WorldSnapshot["equippedRoomItems"] extends Record<infer T, string | null> ? T : never }))) throw new ApiError(422, "ITEM_NOT_OWNED", "Предмет нельзя установить"); } const wegoItems = input.equippedWegoItems ? { ...current.equippedWegoItems, ...input.equippedWegoItems } : current.equippedWegoItems; if (wegoItems.outfit !== "everyday" && (!current.unlockedItemIds.includes(wegoItems.outfit) || !canEquipItem(wegoItems.outfit, { type: "wego", slot: "outfit" }))) throw new ApiError(422, "ITEM_NOT_OWNED", "Образ нельзя надеть"); for (const slot of ["accessory", "emotion"] as const) { const itemId = wegoItems[slot]; if (itemId && (!current.unlockedItemIds.includes(itemId) || !canEquipItem(itemId, { type: "wego", slot }))) throw new ApiError(422, "ITEM_NOT_OWNED", "Аксессуар нельзя надеть"); } const world = normalizeWorld({ ...current, equippedRoomItems: roomItems, equippedWegoItems: wegoItems, outfitId: wegoItems.outfit, updatedAt: new Date().toISOString() }); const mutation = worldState.transform(worldKeyForUser(user.id), { commandId: input.commandId, expectedRevision: input.expectedRevision, update: () => world }); if (mutation.status === "conflict") throw new ApiError(409, "WORLD_REVISION_CONFLICT", "Комната уже изменилась на другом устройстве", { revision: mutation.record.revision, world: mutation.record.world }); const activeSpace = activeSpaceForUser(user.id); if (activeSpace && mutation.status === "applied") eventHub.publish({ type: "world_changed", spaceId: activeSpace.id, version: mutation.record.revision }); return { ...mutation.record, replayed: mutation.status === "replayed" }; });
  app.post("/v1/world/commands", async (request) => { const user = userFromRequest(request as never); const input = worldCommandSchema.parse(request.body); const key = worldKeyForUser(user.id); const action = WegoActionSchema.parse({ ...input.action, id: input.commandId, actorId: user.id, at: runtimeNow().toISOString() }); const mutation = worldState.execute(key, { commandId: input.commandId, expectedRevision: input.expectedRevision, action }); if (mutation.status === "conflict") throw new ApiError(409, "WORLD_REVISION_CONFLICT", "Комната уже изменилась на другом устройстве", { revision: mutation.record.revision, world: mutation.record.world }); const activeSpace = activeSpaceForUser(user.id); if (activeSpace && mutation.status === "applied") eventHub.publish({ type: "world_changed", spaceId: activeSpace.id, version: mutation.record.revision }); return { world: mutation.record.world, revision: mutation.record.revision, replayed: mutation.status === "replayed", action, reward: mutation.result?.reward ?? null, message: mutation.result?.message ?? "Действие сохранено." }; });
  app.post("/v1/world/actions", async (request) => { const user = userFromRequest(request as never); const parsed = WegoActionSchema.parse(request.body); const action = { ...parsed, actorId: user.id, at: runtimeNow().toISOString() }; const key = worldKeyForUser(user.id); const mutation = worldState.execute(key, { commandId: action.id, expectedRevision: worldState.read(key).revision, action }); return { world: mutation.record.world, revision: mutation.record.revision, action, reward: mutation.result?.reward ?? null, message: mutation.result?.message ?? "Действие сохранено." }; });
  app.get("/v1/purchases", async (request) => { const user = userFromRequest(request as never); return { purchases: Array.from(purchases.values()).filter((item) => item.userId === user.id) }; });
  app.post("/v1/billing/invoices", async (request) => {
    const user = userFromRequest(request as never);
    if (!config.billingEnabled) throw new ApiError(503, "BILLING_NOT_CONFIGURED", "Оплата Stars пока не настроена");
    const input = invoiceSchema.parse(request.body);
    const item = catalogItem(input.itemId);
    const starsPrice = item ? resolveStarsPrice(item, user.regionTier) : null;
    if (!item || !starsPrice) throw new ApiError(422, "ITEM_NOT_AVAILABLE", "Этот предмет нельзя купить за Stars");
    const activeSpace = Array.from(spaces.values()).find((space) => space.members.includes(user.id));
    if (input.spaceId) spaceForUser(input.spaceId, user.id);
    const recipientUserId = input.recipientUserId ?? null;
    if (recipientUserId && (!activeSpace || recipientUserId === user.id || !activeSpace.members.includes(recipientUserId))) throw new ApiError(422, "INVALID_GIFT_RECIPIENT", "Подарок можно отправить только партнёру из этого пространства");
    const purchase: Purchase = { id: randomUUID(), userId: user.id, recipientUserId, spaceId: input.spaceId ?? activeSpace?.id ?? null, itemId: item.id, currency: "XTR", amount: starsPrice, status: "pending", telegramPaymentChargeId: null, telegramProviderChargeId: null, createdAt: new Date().toISOString() };
    purchases.set(purchase.id, purchase);
    const invoiceUrl = await createStarsInvoiceLink({ botToken: config.botToken, apiBaseUrl: config.telegramApiBaseUrl, item: { ...item, starsPrice }, payload: starsPurchasePayload({ purchaseId: purchase.id, userId: user.id, itemId: item.id, spaceId: purchase.spaceId, recipientUserId }) });
    return { purchaseId: purchase.id, invoiceUrl };
  });
  app.post("/v1/telegram/webhook", async (request, reply) => {
    const secret = String(request.headers["x-telegram-bot-api-secret-token"] ?? "");
    if (!hasValidWebhookSecret(secret, config.telegramWebhookSecret)) throw new ApiError(403, "INVALID_WEBHOOK", "Webhook не авторизован");
    const update = request.body as TelegramPaymentUpdate;
    const payment = successfulPaymentFrom(update);
    if (payment) {
      const purchase = purchases.get(payment.purchaseId);
      const item = catalogItem(payment.itemId);
      if (purchase && item && purchase.userId === payment.userId && purchase.itemId === item.id && purchase.status !== "paid") {
        purchase.status = "paid"; purchase.telegramPaymentChargeId = payment.telegramPaymentChargeId; purchase.telegramProviderChargeId = payment.telegramProviderChargeId;
        const recipientId = purchase.recipientUserId ?? purchase.userId;
        const entitlementKey = `${recipientId}:${purchase.spaceId ?? "none"}:${purchase.itemId}`;
        if (!entitlements.has(entitlementKey)) entitlements.set(entitlementKey, { id: randomUUID(), userId: recipientId, spaceId: purchase.spaceId, itemId: purchase.itemId, source: "telegram_stars", purchaseId: purchase.id, grantedAt: new Date().toISOString() });
        grantWorldItem(recipientId, purchase.spaceId, purchase.itemId, worldState);
        if (purchase.recipientUserId) creditSparks(purchase.recipientUserId, 10, "gift", `gift-bonus:${purchase.id}`, { action: "gift_received", purchaseId: purchase.id });
      }
    }
    return reply.send({ ok: true });
  });
  app.post("/v1/spaces", async (request) => { const user = userFromRequest(request as never); const input = createSpaceSchema.parse(request.body); if (input.type !== "pair") throw new ApiError(422, "PAIR_ONLY", "WEGO работает с пространствами для двоих"); if (activeSpaceForUser(user.id)) throw new ApiError(409, "ACTIVE_SPACE_EXISTS", "У вас уже есть активное пространство"); const id = randomUUID(); const space: Space = { id, ...input, stage: "egg", character: "Cozy Dreamer", daysAlive: 1, room: input.style === "a" ? "warm" : "morning", members: [user.id] }; spaces.set(id, space); return { space, inviteUrl: `https://t.me/${config.botUsername}/app?startapp=join_${id}` }; });
  app.post("/v1/spaces/:spaceId/invitations", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const token = randomBytes(18).toString("base64url"); space.inviteHash = createHash("sha256").update(token).digest("hex"); space.inviteExpiresAt = new Date(runtimeNow().getTime() + 7 * 86400000).toISOString(); return { url: `https://t.me/${config.botUsername}/app?startapp=join_${token}`, expiresAt: space.inviteExpiresAt }; });
  app.post("/v1/invitations/:token/accept", async (request) => { const user = userFromRequest(request as never); if (activeSpaceForUser(user.id)) throw new ApiError(409, "ACTIVE_SPACE_EXISTS", "У вас уже есть активное пространство"); const token = (request.params as { token: string }).token; const hash = createHash("sha256").update(token).digest("hex"); const space = Array.from(spaces.values()).find((item) => item.inviteHash === hash); if (!space || !space.inviteExpiresAt || Date.parse(space.inviteExpiresAt) <= runtimeNow().getTime()) throw new ApiError(404, "INVITE_NOT_FOUND", "Инвайт устарел или не найден"); if (space.members.length >= 2) throw new ApiError(409, "SPACE_FULL", "В пространстве уже два участника"); if (space.members[0] === user.id) throw new ApiError(409, "INVITE_OWNER", "Нельзя принять собственный инвайт"); space.members.push(user.id); space.inviteHash = undefined; space.inviteExpiresAt = undefined; eventHub.publish({ type: "partner_joined", spaceId: space.id, version: runtimeNow().getTime() }); return { space }; });
  app.post("/v1/spaces/:spaceId/checkins/me", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const input = checkinSchema.parse(request.body); if (input.date !== localDate(space)) throw new ApiError(409, "DAY_CLOSED", "День уже сменился"); const key = `${space.id}:${input.date}:${user.id}`; const current = checkins.get(key); const value: Checkin = { date: input.date, userId: user.id, mood: input.mood, energy: input.energy, want: input.want, note: input.note ? encryptNote(input.note, config.noteEncryptionKey) : null, guess: current?.guess ?? null, revealed: false }; checkins.set(key, value); creditSparks(user.id, 10, "daily", `checkin:${user.id}:${input.date}`, { action: "checkin_personal" }); const partnerId = space.members.find((id) => id !== user.id); const partnerCheckin = partnerId ? checkins.get(`${space.id}:${input.date}:${partnerId}`) : null; if (partnerId && partnerCheckin) { creditSparks(user.id, 5, "daily", `checkin-shared:${user.id}:${input.date}`, { action: "checkin_shared" }); creditSparks(partnerId, 5, "daily", `checkin-shared:${partnerId}:${input.date}`, { action: "checkin_shared" }); } eventHub.publish({ type: "checkin_submitted", spaceId: space.id, date: input.date, version: Date.now() }); return { ok: true, checkin: { ...ownCheckinView(value), note: undefined } }; });
  app.put("/v1/spaces/:spaceId/checkins/me/guess", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const input = z.object({ date: z.string(), guess: z.enum(["great", "good", "calm", "normal", "overloaded", "hard", "irritated"]) }).parse(request.body); if (input.date !== localDate(space)) throw new ApiError(409, "DAY_CLOSED", "День уже сменился"); const current = checkins.get(`${space.id}:${input.date}:${user.id}`); if (!current) throw new ApiError(409, "CHECKIN_REQUIRED", "Сначала заполните check-in"); current.guess = input.guess; eventHub.publish({ type: "guess_saved", spaceId: space.id, date: input.date, version: Date.now() }); return { ok: true }; });
  app.get("/v1/spaces/:spaceId/today", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const date = localDate(space); const mine = checkins.get(`${space.id}:${date}:${user.id}`) ?? null; const partnerId = space.members.find((id) => id !== user.id); const partner = partnerId ? checkins.get(`${space.id}:${date}:${partnerId}`) ?? null : null; return { date, me: mine ? ownCheckinView(mine) : null, partner: partner ? partnerCheckinView(partner, false) : null, canReveal: Boolean(mine?.mood && partner?.mood) }; });
  app.get("/v1/spaces/:spaceId/reveals/:date", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const date = (request.params as { date: string }).date; const mine = checkins.get(`${space.id}:${date}:${user.id}`); const partnerId = space.members.find((id) => id !== user.id); const partner = partnerId ? checkins.get(`${space.id}:${date}:${partnerId}`) : null; if (!mine || !partner) throw new ApiError(409, "REVEAL_LOCKED", "Ответьте оба, чтобы открыть Reveal"); mine.revealed = true; partner.revealed = true; return { date, me: ownCheckinView(mine), partner: partnerCheckinView(partner, true), guess: { selected: mine.guess, correct: mine.guess === partner.mood } }; });
  app.get("/v1/spaces/:spaceId/story", async (request) => { const user = userFromRequest(request as never); spaceForUser((request.params as { spaceId: string }).spaceId, user.id); return { entries: Array.from(stories.values()).filter((story) => story.sourceId.startsWith((request.params as { spaceId: string }).spaceId)).reverse() }; });
  app.post("/v1/spaces/:spaceId/reveals/:date/story", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const date = (request.params as { date: string }).date; const mine = checkins.get(`${space.id}:${date}:${user.id}`); const partnerId = space.members.find((id) => id !== user.id); const partner = partnerId ? checkins.get(`${space.id}:${date}:${partnerId}`) : null; if (!mine || !partner) throw new ApiError(409, "REVEAL_LOCKED", "Reveal пока закрыт"); const sourceId = `${space.id}:${date}`; const existing = Array.from(stories.values()).find((story) => story.sourceId === sourceId); if (existing) return existing; const entry: Story = { id: randomUUID(), sourceType: "reveal", sourceId, date, type: "reveal", title: "Сегодняшний Reveal", body: `Ваши состояния открылись для двоих.`, tone: "lilac" }; stories.set(entry.id, entry); eventHub.publish({ type: "story_saved", spaceId: space.id, date, version: Date.now() }); return entry; });
  app.get("/v1/spaces/:spaceId/activities", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); return { activities: [{ id: "a1", title: "Прогулка без телефонов", description: "20 минут на улице без экранов.", duration: "20 мин", tags: ["улица", "спокойное"], tone: "mint" }, { id: "a2", title: "Wego выбирает фильм", description: "Случайный жребий решит.", duration: "вечер", tags: ["дома", "спонтанное"], tone: "lilac" }], planned: Array.from(planned.get(space.id) ?? []) }; });
  app.post("/v1/spaces/:spaceId/activities/:activityId/plan", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const set = planned.get(space.id) ?? new Set<string>(); set.add((request.params as { activityId: string }).activityId); planned.set(space.id, set); return { planned: Array.from(set) }; });
  app.delete("/v1/spaces/:spaceId/activities/:activityId/plan", async (request) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const set = planned.get(space.id) ?? new Set<string>(); set.delete((request.params as { activityId: string }).activityId); planned.set(space.id, set); return { planned: Array.from(set) }; });
  app.get("/v1/spaces/:spaceId/changes", async (request) => { const user = userFromRequest(request as never); const params = request.params as { spaceId: string }; spaceForUser(params.spaceId, user.id); const cursor = String((request.query as { cursor?: string } | undefined)?.cursor ?? "0"); return store.changes(params.spaceId, cursor, user.id); });
  app.get("/v1/spaces/:spaceId/events", async (request, reply) => { const user = userFromRequest(request as never); const space = spaceForUser((request.params as { spaceId: string }).spaceId, user.id); const cursor = String((request.query as { cursor?: string } | undefined)?.cursor ?? "0"); reply.hijack(); reply.raw.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" }); const missed = await store.changes(space.id, cursor, user.id); for (const change of missed.changes) reply.raw.write(`id: ${change.cursor}\ndata: ${JSON.stringify({ type: change.type, spaceId: space.id, entityId: change.entityId, version: change.revision })}\n\n`); reply.raw.write(`id: ${missed.cursor}\ndata: ${JSON.stringify({ type: "connected", spaceId: space.id, version: missed.cursor })}\n\n`); const unsubscribe = eventHub.subscribe(space.id, reply.raw); const heartbeat = setInterval(() => { try { reply.raw.write(": heartbeat\n\n"); } catch { clearInterval(heartbeat); unsubscribe(); } }, 25000); request.raw.on("close", () => { clearInterval(heartbeat); unsubscribe(); }); });
  const moduleContext = { store, userId: (request: unknown) => userFromRequest(request as never).id, requireSpace: async (_tx: unknown, spaceId: string, userId: string) => spaceForUser(spaceId, userId) };
  registerLifeRoutes(app, moduleContext);
  registerNotificationRoutes(app, moduleContext);
  options.registerModules?.(app, moduleContext);
  return app;
}

if (process.env.NODE_ENV !== "test") buildServer().listen({ port: config.port, host: config.host }).catch((error) => { console.error(error); process.exit(1); });
