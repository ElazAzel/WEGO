import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Store } from "../../persistence/repository";

export type StoredNotification = {
  id: string;
  category: "task" | "calendar" | "partner" | "pet" | "system";
  title: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  readAt: string | null;
  deepLink?: string;
};

type NotificationPreference = {
  enabled: boolean;
  telegram: boolean;
  webPush: boolean;
  quietFrom: string;
  quietTo: string;
  timezone: string;
  hidePreview: boolean;
  categories: Record<StoredNotification["category"], boolean>;
};

type Context = { store: Store; userId(request: unknown): string };
const notifications = "notifications";
const preferences = "notification-preferences";
const subscription = z.object({ endpoint: z.string().url().max(2048), keys: z.object({ p256dh: z.string().min(1).max(512), auth: z.string().min(1).max(512) }).strict() }).strict();
const preferencePatch = z.object({
  enabled: z.boolean().optional(), telegram: z.boolean().optional(), webPush: z.boolean().optional(),
  quietFrom: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), quietTo: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  timezone: z.string().min(1).max(80).optional(), hidePreview: z.boolean().optional(),
  categories: z.record(z.enum(["task", "calendar", "partner", "pet", "system"]), z.boolean()).optional(),
}).strict();

const defaultPreferences = (): NotificationPreference => ({
  enabled: true,
  telegram: true,
  webPush: false,
  quietFrom: "23:00",
  quietTo: "08:00",
  timezone: "Asia/Almaty",
  hidePreview: false,
  categories: { task: true, calendar: true, partner: true, pet: true, system: true },
});

function sortNewest(items: StoredNotification[]) { return items.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }

export function registerNotificationRoutes(app: FastifyInstance, context: Context) {
  app.get("/v1/notifications", async request => {
    const userId = context.userId(request);
    const limit = Math.min(100, Math.max(1, Number((request.query as { limit?: string } | undefined)?.limit ?? 50) || 50));
    const now = Date.now();
    const all = await context.store.transaction(userId, tx => tx.list<StoredNotification>(notifications));
    const visible = sortNewest(all.filter(item => Date.parse(item.expiresAt) > now)).slice(0, limit);
    return { notifications: visible, unread: visible.filter(item => !item.readAt).length };
  });

  app.post("/v1/notifications/:notificationId/read", async request => {
    const userId = context.userId(request);
    const notificationId = String((request.params as { notificationId: string }).notificationId);
    return context.store.transaction(userId, async tx => {
      const item = await tx.get<StoredNotification>(notifications, notificationId);
      if (!item) return { ok: true, found: false };
      const updated = { ...item, readAt: item.readAt ?? new Date().toISOString() };
      await tx.put(notifications, item.id, updated);
      return { ok: true, found: true, notification: updated };
    });
  });

  app.get("/v1/notifications/preferences", async request => {
    const userId = context.userId(request);
    const value = await context.store.transaction(userId, tx => tx.get<NotificationPreference>(preferences, userId));
    return { preferences: { ...defaultPreferences(), ...(value ?? {}), categories: { ...defaultPreferences().categories, ...(value?.categories ?? {}) } } };
  });

  app.put("/v1/notifications/preferences", async request => {
    const userId = context.userId(request);
    const patch = preferencePatch.parse(request.body);
    return context.store.transaction(userId, async tx => {
      const current = await tx.get<NotificationPreference>(preferences, userId) ?? defaultPreferences();
      const next = { ...current, ...patch, categories: { ...current.categories, ...(patch.categories ?? {}) } };
      await tx.put(preferences, userId, next);
      return { preferences: next };
    });
  });

  app.put("/v1/notifications/web-push-subscription", async request => {
    const userId = context.userId(request);
    const value = subscription.parse(request.body);
    const id = `${userId}:${value.endpoint}`;
    await context.store.transaction(userId, tx => tx.put("web-push-subscriptions", id, { ...value, userId, updatedAt: new Date().toISOString() }));
    return { ok: true };
  });
}
