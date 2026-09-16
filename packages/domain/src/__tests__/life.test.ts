import { describe, expect, it } from "vitest";
import { applyLifeCommand, visibleLifeRecords, budgetForPlan, LifeDataSchema, type LifeRecord } from "../life";

const context = { userId: "alice", spaceId: "space", memberIds: ["alice", "bob"], now: "2026-09-15T10:00:00.000Z" };
const put = (kind: string, id: string, data: unknown) => ({ type: "put", id, kind, data, expectedRevision: 0 } as const);
function create(kind: string, id: string, data: unknown, records: LifeRecord[] = []) {
  return applyLifeCommand(records, put(kind, id, data), context).records;
}

describe("connected household commands", () => {
  it("converts a wish without retyping it and links tasks, dates and expenses to the same plan", () => {
    let records = create("wish", "wish", { title: "Япония", currency: "EUR", amount: 500000, priority: "high" });
    records = applyLifeCommand(records, { type: "convertWish", id: "wish", planId: "trip", expectedRevision: 1 }, context).records;
    expect(records.find(r => r.id === "trip")?.data).toMatchObject({ title: "Япония", currency: "EUR", target: 500000, wishId: "wish" });
    records = create("task", "visa", { title: "Виза", planId: "trip", due: "2026-10-01" }, records);
    records = applyLifeCommand(records, { type: "claimTask", id: "visa", expectedRevision: 1 }, context).records;
    expect(records.find(r => r.id === "visa")?.data).toMatchObject({ assigneeId: "alice", status: "open" });
    records = create("transaction", "saving", { planId: "trip", type: "saving", amount: 240000, currency: "EUR", date: "2026-09-15" }, records);
    records = create("transaction", "spend", { planId: "trip", type: "expense", amount: 40000, currency: "EUR", date: "2026-09-15" }, records);
    expect(budgetForPlan(records, "trip")).toMatchObject({ saved: 240000, spent: 40000, remaining: 200000, target: 500000, currency: "EUR" });
  });
  it("rejects stale revisions, unknown references, different currency and an outside assignee", () => {
    const records = create("plan", "trip", { title: "Поездка", currency: "RUB", target: 10000 });
    expect(() => applyLifeCommand(records, put("plan", "trip", { title: "Перезапись" }), context)).toThrow(/измен/);
    expect(() => create("task", "t", { title: "T", planId: "missing" }, records)).toThrow(/план/i);
    expect(() => create("task", "t", { title: "T", assigneeId: "mallory" }, records)).toThrow(/участник/i);
    expect(() => create("transaction", "x", { planId: "trip", type: "expense", amount: 1, currency: "USD", date: "2026-09-15" }, records)).toThrow(/валют/i);
    expect(LifeDataSchema.transaction.safeParse({ planId: "trip", type: "expense", amount: 1.5, currency: "RUB", date: "2026-09-15" }).success).toBe(false);
  });
  it("preserves note versions and refuses overwriting a newer draft", () => {
    let records = create("note", "n", { title: "Рецепт", content: { type: "doc", content: [] } });
    records = applyLifeCommand(records, { ...put("note", "n", { title: "Пирог", content: { type: "doc", content: [] } }), expectedRevision: 1 }, context).records;
    expect(records.find(r => r.id === "n")?.history?.[0]?.data).toMatchObject({ title: "Рецепт" });
    expect(() => applyLifeCommand(records, { ...put("note", "n", { title: "Черновик" }), expectedRevision: 1 }, context)).toThrow(/измен/);
  });
});

describe("server-side privacy projections", () => {
  it("does not reveal a capsule body or attachments before unlock to the recipient", () => {
    const records = create("capsule", "letter", { title: "К годовщине", body: "Секрет", opensAt: "2027-02-14T00:00:00Z", attachmentIds: ["private-file"] });
    const locked = visibleLifeRecords(records, { ...context, userId: "bob" })[0];
    expect(JSON.stringify(locked)).not.toContain("Секрет");
    expect(JSON.stringify(locked)).not.toContain("private-file");
    expect(locked?.data).toMatchObject({ locked: true });
    expect(visibleLifeRecords(records, { ...context, userId: "bob", now: "2027-02-14T00:00:00Z" })[0]?.data).toMatchObject({ body: "Секрет" });
  });
  it("withholds partner answers until both members have answered", () => {
    let records = create("question", "q", { title: "Что хочется сделать вместе?", date: "2026-09-15" });
    records = applyLifeCommand(records, { type: "answer", id: "q", answer: "Гулять", expectedRevision: 1 }, context).records;
    expect(JSON.stringify(visibleLifeRecords(records, { ...context, userId: "bob" }))).not.toContain("Гулять");
    records = applyLifeCommand(records, { type: "answer", id: "q", answer: "Кино", expectedRevision: 2 }, { ...context, userId: "bob" }).records;
    expect(visibleLifeRecords(records, context)[0]?.data).toMatchObject({ answers: { alice: "Гулять", bob: "Кино" }, locked: false });
  });
  it("never reveals answers for a one-member space and rejects writing answers through generic updates", () => {
    expect(() => create("question", "q", { title: "Q", date: "2026-09-15", answers: { bob: "Injected" } })).toThrow();
    let records = create("question", "q", { title: "Q", date: "2026-09-15" });
    records = applyLifeCommand(records, { type: "answer", id: "q", answer: "A", expectedRevision: 1 }, context).records;
    expect(visibleLifeRecords(records, { ...context, memberIds: ["alice"] })[0]?.data).toMatchObject({ locked: true });
  });
});
