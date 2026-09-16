import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "../../server";
import { createTelegramInitData } from "../../telegram-auth";

const apps: ReturnType<typeof buildServer>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())); });
async function auth(app: ReturnType<typeof buildServer>, id: number) { const response = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: createTelegramInitData({ id, first_name: `User ${id}` }, "local-bot-secret", new Date()) } }); return { authorization: `Bearer ${response.json().token}` }; }
describe("life module HTTP boundary", () => {
  it("keeps plan, task and calendar records in one space and replays a command", async () => {
    const app = buildServer(); apps.push(app); const headers = await auth(app, 101);
    const space = (await app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Дом", type: "pair" } })).json().space;
    const command = { commandId: "plan-command", command: { type: "put", id: "plan", kind: "plan", expectedRevision: 0, data: { title: "Поездка", type: "trip", currency: "EUR", target: 1000, status: "open", description: "", attachmentIds: [] } } };
    const first = await app.inject({ method: "POST", url: `/v1/spaces/${space.id}/life/commands`, headers, payload: command });
    const replay = await app.inject({ method: "POST", url: `/v1/spaces/${space.id}/life/commands`, headers, payload: command });
    expect(first.statusCode).toBe(200); expect(replay.json().replayed).toBe(true);
    expect((await app.inject({ url: `/v1/spaces/${space.id}/life`, headers })).json().records[0].data.title).toBe("Поездка");
  });
  it("does not put the body of a locked capsule in the response", async () => {
    const app = buildServer(); apps.push(app); const headers = await auth(app, 102); const space = (await app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Дом", type: "pair" } })).json().space;
    const response = await app.inject({ method: "POST", url: `/v1/spaces/${space.id}/life/commands`, headers, payload: { commandId: "capsule", command: { type: "put", id: "capsule", kind: "capsule", expectedRevision: 0, data: { title: "Потом", body: "секрет", opensAt: "2099-01-01T00:00:00.000Z", attachmentIds: [] } } } });
    expect(response.statusCode).toBe(200); expect(JSON.stringify(response.json())).not.toContain("секрет");
  });
});
