import { describe, expect, it } from "vitest";
import { buildServer } from "./server";

describe("API living-world economy boundary", () => {
  it("returns catalog and wallet only after local session auth", async () => {
    const app = buildServer();
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
    expect(auth.statusCode).toBe(200);
    const token = auth.json<{ token: string }>().token;
    const headers = { authorization: `Bearer ${token}` };
    const catalog = await app.inject({ method: "GET", url: "/v1/catalog", headers });
    const wallet = await app.inject({ method: "GET", url: "/v1/wallet", headers });
    expect(catalog.statusCode).toBe(200);
    expect(catalog.json().items.some((item: { id: string }) => item.id === "sticker-pack-cozy")).toBe(true);
    expect(wallet.json().wallet.balance).toBe(120);
    await app.close();
  });

  it("does not create a Stars invoice when billing is not configured", async () => {
    const app = buildServer();
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
    const token = auth.json<{ token: string }>().token;
    const response = await app.inject({ method: "POST", url: "/v1/billing/invoices", headers: { authorization: `Bearer ${token}` }, payload: { itemId: "sticker-pack-cozy" } });
    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe("BILLING_NOT_CONFIGURED");
    await app.close();
  });

  it("credits a personal check-in once and keeps the duplicate idempotent", async () => {
    const app = buildServer();
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
    const token = auth.json<{ token: string }>().token;
    const headers = { authorization: `Bearer ${token}` };
    const spaceResponse = await app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Наш уголок", type: "pair", style: "a", timezone: "Asia/Almaty" } });
    const spaceId = spaceResponse.json<{ space: { id: string } }>().space.id;
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const payload = { date, mood: "calm", energy: "mid", want: "together", note: "", clientMutationId: "checkin-test-1" };
    await app.inject({ method: "POST", url: `/v1/spaces/${spaceId}/checkins/me`, headers, payload });
    await app.inject({ method: "POST", url: `/v1/spaces/${spaceId}/checkins/me`, headers, payload: { ...payload, clientMutationId: "checkin-test-2" } });
    const wallet = await app.inject({ method: "GET", url: "/v1/wallet", headers });
    expect(wallet.json().wallet.balance).toBe(130);
    expect(wallet.json().ledger.filter((entry: { idempotencyKey: string }) => entry.idempotencyKey === `checkin:tg-0:${date}`)).toHaveLength(1);
    await app.close();
  });

  it("persists room interactions behind the authenticated world boundary", async () => {
    const app = buildServer();
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
    const token = auth.json<{ token: string }>().token;
    const headers = { authorization: `Bearer ${token}` };
    const action = { id: "api-lamp-1", type: "room_interact", actorId: "spoofed", objectId: "lamp", interaction: "toggle", at: "2026-08-27T10:00:00.000Z" };
    const changed = await app.inject({ method: "POST", url: "/v1/world/actions", headers, payload: action });
    const world = await app.inject({ method: "GET", url: "/v1/world", headers });

    expect(changed.statusCode).toBe(200);
    expect(changed.json().world.environment.lamp).toBe("off");
    expect(changed.json().action.actorId).not.toBe("spoofed");
    expect(world.json().world.environment.lamp).toBe("off");
    await app.close();
  });

  it("allows an authenticated user to equip only owned catalog items", async () => {
    const app = buildServer();
    const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
    const token = auth.json<{ token: string }>().token;
    const headers = { authorization: `Bearer ${token}` };
    const changed = await app.inject({ method: "PUT", url: "/v1/world/equipment", headers, payload: { equippedRoomItems: { sofa: "soft-blanket" }, equippedWegoItems: { outfit: "everyday", accessory: null, emotion: null } } });
    const rejected = await app.inject({ method: "PUT", url: "/v1/world/equipment", headers, payload: { equippedRoomItems: { wall: "rainy-window" }, equippedWegoItems: { outfit: "everyday", accessory: null, emotion: null } } });

    expect(changed.statusCode).toBe(200);
    expect(changed.json().world.equippedRoomItems.sofa).toBe("soft-blanket");
    expect(rejected.statusCode).toBe(422);
    await app.close();
  });
});
