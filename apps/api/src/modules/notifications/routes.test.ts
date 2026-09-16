import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../server";
import { createTelegramInitData } from "../../telegram-auth";

const apps: ReturnType<typeof buildServer>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())); });

describe("notification center", () => {
  it("persists preferences, push subscriptions and read state behind user auth", async () => {
    let store: any;
    const app = buildServer({ registerModules: (_app, context) => { store = context.store; } }); apps.push(app);
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: createTelegramInitData({ id: 901, first_name: "Nina" }, "local-bot-secret", new Date()) } });
    const headers = { authorization: `Bearer ${auth.json<{ token: string }>().token}` };
    expect(auth.statusCode).toBe(200);
    await app.inject({ method: "PUT", url: "/v1/notifications/preferences", headers, payload: { webPush: true, hidePreview: true } });
    await app.inject({ method: "PUT", url: "/v1/notifications/web-push-subscription", headers, payload: { endpoint: "https://push.example.test/901", keys: { p256dh: "key", auth: "auth" } } });
    await store.transaction("tg-901", (tx: any) => tx.put("notifications", "n-1", { id: "n-1", category: "system", title: "Готово", body: "Синхронизация включена", createdAt: new Date().toISOString(), expiresAt: "2099-01-01T00:00:00.000Z", readAt: null }));
    const list = await app.inject({ url: "/v1/notifications", headers });
    expect(list.json()).toMatchObject({ unread: 1, notifications: [{ id: "n-1" }] });
    const marked = await app.inject({ method: "POST", url: "/v1/notifications/n-1/read", headers });
    expect(marked.json().notification.readAt).toEqual(expect.any(String));
    const preferences = await app.inject({ url: "/v1/notifications/preferences", headers });
    expect(preferences.json().preferences).toMatchObject({ webPush: true, hidePreview: true });
  });
});
