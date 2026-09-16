import { afterEach, describe, expect, it } from "vitest";
import { buildServer } from "./server";
import { createTelegramInitData } from "./telegram-auth";

const apps: ReturnType<typeof buildServer>[] = [];
function server(options: any = {}) { const app = (buildServer as any)(options); apps.push(app); return app as ReturnType<typeof buildServer>; }
afterEach(async () => { await Promise.all(apps.splice(0).map(app => app.close())); });
async function login(app: ReturnType<typeof buildServer>, id = 1) {
  const response = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: createTelegramInitData({ id, first_name: `User ${id}` }, "local-bot-secret", new Date()) } });
  expect(response.statusCode).toBe(200);
  return { authorization: `Bearer ${response.json().token}` };
}
async function space(app: ReturnType<typeof buildServer>, headers: Record<string,string>) {
  const response = await app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Pair", type: "pair" } });
  expect(response.statusCode).toBe(200); return response.json().space;
}

describe("durable foundation API contract", () => {
  it("isolates sessions between independent default test servers", async () => {
    const a = server(), b = server(); const headers = await login(a);
    expect((await b.inject({ url: "/v1/bootstrap", headers })).statusCode).toBe(401);
  });
  it("returns 401 for invalid signed login and malformed cookies", async () => {
    const app = server();
    expect((await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "invalid" } })).statusCode).toBe(401);
    expect((await app.inject({ url: "/v1/bootstrap", headers: { cookie: "wego_session=%ZZ" } })).statusCode).toBe(401);
  });
  it("disables empty initData when demo is explicitly disabled", async () => {
    const app = server({ demo: false });
    expect((await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } })).statusCode).toBe(401);
  });
  it("revokes sessions on logout", async () => {
    const app = server(), headers = await login(app);
    expect((await app.inject({ method: "POST", url: "/v1/auth/logout", headers })).statusCode).toBe(200);
    expect((await app.inject({ url: "/v1/bootstrap", headers })).statusCode).toBe(401);
  });
  it("expires sessions using server time", async () => {
    let now = Date.now(); const app = server({ now: () => new Date(now), sessionTtlMs: 1000 });
    const headers = await login(app); now += 1001;
    expect((await app.inject({ url: "/v1/bootstrap", headers })).statusCode).toBe(401);
  });
  it("rejects non-pair spaces and serializes concurrent active-space creation", async () => {
    const app = server(), headers = await login(app);
    expect((await app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Family", type: "family" } })).statusCode).toBe(422);
    const responses = await Promise.all([1,2].map(() => app.inject({ method: "POST", url: "/v1/spaces", headers, payload: { name: "Pair", type: "pair" } })));
    expect(responses.map(r => r.statusCode).sort()).toEqual([200,409]);
  });
  it("rejects an expired invitation", async () => {
    let now = Date.now(); const app = server({ now: () => new Date(now) });
    const owner = await login(app, 10), guest = await login(app, 11); const pair = await space(app, owner);
    const invite = await app.inject({ method: "POST", url: `/v1/spaces/${pair.id}/invitations`, headers: owner });
    const token = invite.json().url.split("join_")[1]; now += 8 * 86400000;
    expect((await app.inject({ method: "POST", url: `/v1/invitations/${token}/accept`, headers: guest })).statusCode).toBe(404);
  });
  it("allows exactly one invite consumption and rejects a second active space", async () => {
    const app = server(); const owner = await login(app,20), a = await login(app,21), b = await login(app,22);
    const pair = await space(app, owner);
    const invite = await app.inject({ method: "POST", url: `/v1/spaces/${pair.id}/invitations`, headers: owner });
    const token = invite.json().url.split("join_")[1];
    const responses = await Promise.all([a,b].map(headers => app.inject({ method: "POST", url: `/v1/invitations/${token}/accept`, headers })));
    expect(responses.map(r=>r.statusCode).sort()).toEqual([200,404]);
    const winner = responses[0].statusCode === 200 ? a : b;
    expect((await app.inject({ method: "POST", url: "/v1/spaces", headers: winner, payload: { name: "Other", type: "pair" } })).statusCode).toBe(409);
  });
  it("uses authoritative action time and actor", async () => {
    const app = server({ now: () => new Date("2026-09-15T12:00:00Z") }), headers = await login(app);
    const response = await app.inject({ method: "POST", url: "/v1/world/actions", headers, payload: { id: "clock", type: "room_interact", objectId: "lamp", interaction: "toggle", actorId: "forged", at: "2099-01-01T00:00:00Z" } });
    expect(response.json().action).toMatchObject({ actorId: "tg-1", at: "2026-09-15T12:00:00.000Z" });
  });
  it("serializes competing revisions and replays a receipt after another command", async () => {
    const app = server(), headers = await login(app,40);
    const action = { type:"room_interact",objectId:"lamp",interaction:"toggle",at:"2099-01-01T00:00:00Z" };
    const responses = await Promise.all(["first","second"].map(commandId=>app.inject({ method:"POST",url:"/v1/world/commands",headers,payload:{commandId,expectedRevision:0,action} })));
    expect(responses.map(r=>r.statusCode).sort()).toEqual([200,409]);
    const winner = responses[0].statusCode === 200 ? "first" : "second";
    await app.inject({ method:"POST",url:"/v1/world/commands",headers,payload:{commandId:"next",expectedRevision:1,action} });
    const replay = await app.inject({ method:"POST",url:"/v1/world/commands",headers,payload:{commandId:winner,expectedRevision:0,action} });
    expect(replay.json()).toMatchObject({revision:2,replayed:true});
    expect((await app.inject({url:"/v1/world",headers})).json().world.environment.lamp).toBe("on");
  });
  it("exposes module hooks with scoped atomic records and metadata journal", async () => {
    let ctx: any;
    const app = server({ registerModules: (_app: unknown, context: unknown) => { ctx = context; } });
    await app.ready(); expect(ctx).toBeDefined();
    const owner = await login(app,30), outsider = await login(app,31); const pair = await space(app,owner);
    await ctx.store.transaction("tg-30", async (tx: any) => {
      await ctx.requireSpace(tx,pair.id,"tg-30");
      await tx.put(`life:${pair.id}`,"plan",{ id:"plan",title:"Private" });
      await tx.append(pair.id,"plan_changed","plan",1);
    });
    await expect(ctx.store.transaction("tg-31", (tx:any)=>tx.list(`life:${pair.id}`))).rejects.toThrow();
    await expect(ctx.store.transaction("tg-30",async(tx:any)=> { await tx.put(`life:${pair.id}`,"rolled-back",{id:"rolled-back"}); throw new Error("rollback"); })).rejects.toThrow("rollback");
    expect(await ctx.store.transaction("tg-30",(tx:any)=>tx.get(`life:${pair.id}`,"rolled-back"))).toBeNull();
    const journal = await ctx.store.changes(pair.id,"0","tg-30");
    expect(journal.changes.at(-1)).toMatchObject({ spaceId:pair.id,type:"plan_changed",entityId:"plan",revision:1 });
    expect(JSON.stringify(journal)).not.toContain("Private");
    expect((await app.inject({ url: `/v1/spaces/${pair.id}/changes?cursor=0`, headers: outsider })).statusCode).toBe(403);
  });
});
