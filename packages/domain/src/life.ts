import { z } from "zod";

const title = z.string().trim().min(1).max(160);
const id = z.string().min(1).max(120);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Некорректная дата");
const instant = z.string().datetime({ offset: true });
const currency = z.string().regex(/^[A-Z]{3}$/);
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const tags = z.array(z.string().trim().min(1).max(40)).max(20).default([]);
const attachments = z.array(id).max(30).default([]);
const webUrl = z.string().url().refine(v => /^https?:\/\//i.test(v), "Нужна HTTP(S) ссылка");
const timezone = z.string().refine(v => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } });
const repeat = z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none");

/** Only editable fields. Author, answers, revisions and provider credentials are never input fields. */
export const LifeDataSchema = {
  task: z.object({ title, planId: id.optional(), assigneeId: id.nullable().default(null), due: day.optional(), status: z.enum(["open", "done"]).default("open"), repeat, description: z.string().max(2000).default("") }).strict(),
  list: z.object({ title, items: z.array(z.object({ id, text: title, done: z.boolean().default(false) }).strict()).max(200).default([]), planId: id.optional() }).strict(),
  wish: z.object({ title, link: webUrl.optional(), photoId: id.optional(), amount: money.optional(), currency: currency.default("RUB"), priority: z.enum(["normal", "high"]).default("normal"), fulfilled: z.boolean().default(false) }).strict(),
  plan: z.object({ title, type: z.enum(["trip", "goal", "event", "repair"]).default("goal"), currency: currency.default("RUB"), target: money.default(0), status: z.enum(["open", "done"]).default("open"), description: z.string().max(4000).default(""), wishId: id.optional(), attachmentIds: attachments }).strict(),
  transaction: z.object({ planId: id, type: z.enum(["saving", "expense"]), amount: money.refine(v => v > 0), currency, date: day, description: z.string().max(500).default("") }).strict(),
  calendar: z.object({ title, start: z.string(), end: z.string(), allDay: z.boolean().default(false), timezone: timezone.default("UTC"), repeat, planId: id.optional(), taskId: id.optional(), description: z.string().max(4000).default(""), reminderMinutes: z.number().int().min(0).max(10080).nullable().default(30), exceptionDates: z.array(day).max(366).default([]) }).strict().superRefine((v, ctx) => {
    const schema = v.allDay ? day : instant;
    if (!schema.safeParse(v.start).success || !schema.safeParse(v.end).success || v.end <= v.start || (!v.allDay && Date.parse(v.end) <= Date.parse(v.start))) ctx.addIssue({ code: "custom", message: "Конец события должен быть позже начала; укажите часовой пояс", path: ["end"] });
  }),
  template: z.object({ title, startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), durationMinutes: z.number().int().min(1).max(10080), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#5a99da") }).strict(),
  person: z.object({ title, month: z.number().int().min(1).max(12), day: z.number().int().min(1).max(31), year: z.number().int().min(1900).max(2200).optional() }).strict().refine(v => new Date(Date.UTC(v.year ?? 2000, v.month - 1, v.day)).getUTCMonth() === v.month - 1, "Некорректный день рождения"),
  note: z.object({ title, content: z.record(z.unknown()).default({ type: "doc", content: [] }), folder: z.string().max(80).default(""), tags, attachmentIds: attachments }).strict(),
  file: z.object({ title, objectKey: z.string().min(1).max(500), mime: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), bytes: z.number().int().positive().max(20 * 1024 * 1024), offline: z.boolean().default(false) }).strict(),
  card: z.object({ title, code: z.string().min(1).max(1000), format: z.enum(["qrcode", "ean13", "ean8", "code128", "code39", "pdf417"]), offline: z.boolean().default(false) }).strict(),
  capsule: z.object({ title, body: z.string().min(1).max(20000), opensAt: instant, attachmentIds: attachments }).strict(),
  question: z.object({ title, date: day, options: z.array(title).max(8).default([]) }).strict(),
  memory: z.object({ title, body: z.string().max(10000).default(""), date: day, album: z.string().max(80).default(""), planId: id.optional(), attachmentIds: attachments }).strict(),
  preferences: z.object({ title: z.string().default("Настройки"), relationshipDate: day.optional(), navigation: z.array(z.enum(["home", "calendar", "tasks", "plans", "wishes", "notes", "history", "cards", "pet"])).length(4).refine(v => new Set(v).size === 4).default(["home", "calendar", "tasks", "plans"]), theme: z.enum(["system", "light", "dark"]).default("system") }).strict(),
} as const;
export type LifeKind = keyof typeof LifeDataSchema;
export type LifeData<K extends LifeKind = LifeKind> = z.infer<(typeof LifeDataSchema)[K]>;
export type LifeRecord = { id: string; spaceId: string; kind: LifeKind; revision: number; createdBy: string; createdAt: string; updatedAt: string; data: Record<string, unknown>; history?: { revision: number; data: Record<string, unknown>; updatedAt: string }[] };
export type LifeContext = { userId: string; spaceId: string; memberIds: string[]; now: string };
export const LifeCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("put"), id, kind: z.string(), data: z.unknown(), expectedRevision: z.number().int().nonnegative() }).strict(),
  z.object({ type: z.literal("delete"), id, expectedRevision: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("claimTask"), id, expectedRevision: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("complete"), id, expectedRevision: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("convertWish"), id, planId: id, expectedRevision: z.number().int().positive() }).strict(),
  z.object({ type: z.literal("answer"), id, answer: z.string().trim().min(1).max(4000), expectedRevision: z.number().int().positive() }).strict(),
]);
export type LifeCommand = z.infer<typeof LifeCommandSchema>;
export class LifeError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 422) { super(message); }
}
function requireRecord(records: LifeRecord[], id: string, kind?: LifeKind): LifeRecord {
  const record = records.find(r => r.id === id && (!kind || r.kind === kind));
  if (!record) throw new LifeError("NOT_FOUND", kind === "plan" ? "Связанный план не найден" : "Запись не найдена", 404);
  return record;
}
function validateReferences(records: LifeRecord[], kind: LifeKind, data: Record<string, unknown>, ctx: LifeContext) {
  if (typeof data.planId === "string") {
    const plan = requireRecord(records, data.planId, "plan");
    if (kind === "transaction" && data.currency !== plan.data.currency) throw new LifeError("CURRENCY_MISMATCH", "Валюта операции должна совпадать с валютой плана");
  }
  if (typeof data.taskId === "string") requireRecord(records, data.taskId, "task");
  if (typeof data.wishId === "string") requireRecord(records, data.wishId, "wish");
  if (typeof data.assigneeId === "string" && !ctx.memberIds.includes(data.assigneeId)) throw new LifeError("INVALID_ASSIGNEE", "Исполнитель должен быть участником пространства");
  if (kind === "file" && (typeof data.objectKey !== "string" || !data.objectKey.startsWith(`${ctx.spaceId}/`) || data.objectKey.includes(".."))) throw new LifeError("INVALID_OBJECT", "Файл не принадлежит пространству");
}

/** Pure domain transition; persistence layer supplies trusted membership/time and idempotency. */
export function applyLifeCommand(input: LifeRecord[], raw: unknown, ctx: LifeContext): { records: LifeRecord[]; changed: LifeRecord[]; deleted: string[] } {
  if (!ctx.memberIds.includes(ctx.userId)) throw new LifeError("FORBIDDEN", "Нет доступа к пространству", 403);
  const command = LifeCommandSchema.parse(raw);
  const records = structuredClone(input.filter(r => r.spaceId === ctx.spaceId));
  const current = records.find(r => r.id === command.id);
  if ((current?.revision ?? 0) !== command.expectedRevision) throw new LifeError("REVISION_CONFLICT", "Запись изменилась на другом устройстве. Черновик сохранён", 409);
  const changed: LifeRecord[] = [];
  const save = (recordId: string, kind: LifeKind, data: Record<string, unknown>, previous?: LifeRecord) => {
    validateReferences(records, kind, data, ctx);
    const next: LifeRecord = { id: recordId, kind, spaceId: ctx.spaceId, revision: (previous?.revision ?? 0) + 1, createdBy: previous?.createdBy ?? ctx.userId, createdAt: previous?.createdAt ?? ctx.now, updatedAt: ctx.now, data };
    if (kind === "note" && previous) next.history = [{ revision: previous.revision, data: previous.data, updatedAt: previous.updatedAt }, ...(previous.history ?? [])].slice(0, 20);
    const index = records.findIndex(r => r.id === recordId);
    if (index < 0) records.push(next); else records[index] = next;
    changed.push(next);
    return next;
  };
  if (command.type === "put") {
    if (!Object.hasOwn(LifeDataSchema, command.kind)) throw new LifeError("INVALID_KIND", "Неизвестный раздел");
    const kind = command.kind as LifeKind;
    if (current && current.kind !== kind) throw new LifeError("KIND_MISMATCH", "Нельзя изменить тип записи");
    if (current?.kind === "capsule" && current.createdBy !== ctx.userId) throw new LifeError("FORBIDDEN", "Письмо может изменять только автор", 403);
    if (current?.kind === "question" && Object.keys((current.data.answers ?? {}) as object).length) throw new LifeError("QUESTION_STARTED", "На вопрос уже отвечают");
    const data = LifeDataSchema[kind].parse(command.data) as Record<string, unknown>;
    if (kind === "plan" && current && data.currency !== current.data.currency && records.some(r => r.kind === "transaction" && r.data.planId === current.id)) throw new LifeError("CURRENCY_IN_USE", "Нельзя менять валюту плана с операциями");
    save(command.id, kind, data, current);
  } else {
    if (!current) throw new LifeError("NOT_FOUND", "Запись не найдена", 404);
    if (command.type === "delete") {
      if (current.kind === "capsule" && current.createdBy !== ctx.userId) throw new LifeError("FORBIDDEN", "Письмо может удалить только автор", 403);
      if (records.some(r => r.id !== current.id && (r.data.planId === current.id || r.data.taskId === current.id || r.data.wishId === current.id || (r.data.attachmentIds as string[] | undefined)?.includes(current.id)))) throw new LifeError("RECORD_IN_USE", "Сначала удалите связи с этой записью", 409);
      return { records: records.filter(r => r.id !== current.id), changed, deleted: [current.id] };
    }
    if (command.type === "claimTask") {
      if (current.kind !== "task") throw new LifeError("INVALID_ACTION", "Можно взять только задачу");
      if (current.data.assigneeId && current.data.assigneeId !== ctx.userId) throw new LifeError("ALREADY_ASSIGNED", "Задача уже у партнёра", 409);
      save(current.id, current.kind, { ...current.data, assigneeId: ctx.userId }, current);
    }
    if (command.type === "complete") {
      if (!["task", "plan", "wish"].includes(current.kind)) throw new LifeError("INVALID_ACTION", "Эту запись нельзя завершить");
      save(current.id, current.kind, { ...current.data, ...(current.kind === "wish" ? { fulfilled: true } : { status: "done" }), completedAt: ctx.now }, current);
    }
    if (command.type === "convertWish") {
      if (current.kind !== "wish") throw new LifeError("INVALID_ACTION", "Выберите желание");
      if (records.some(r => r.id === command.planId) || current.data.planId) throw new LifeError("ALREADY_CONVERTED", "План уже существует", 409);
      save(command.planId, "plan", LifeDataSchema.plan.parse({ title: current.data.title, currency: current.data.currency, target: current.data.amount ?? 0, wishId: current.id }));
      save(current.id, current.kind, { ...current.data, planId: command.planId }, current);
    }
    if (command.type === "answer") {
      if (current.kind !== "question") throw new LifeError("INVALID_ACTION", "Выберите вопрос");
      const answers = { ...((current.data.answers ?? {}) as Record<string, string>) };
      if (answers[ctx.userId]) throw new LifeError("ALREADY_ANSWERED", "Ответ уже сохранён", 409);
      const options = current.data.options as string[];
      if (options.length && !options.includes(command.answer)) throw new LifeError("INVALID_ANSWER", "Выберите один из вариантов");
      answers[ctx.userId] = command.answer;
      save(current.id, current.kind, { ...current.data, answers }, current);
    }
  }
  return { records, changed, deleted: [] };
}

/** Use for every response, export and cache; journal carries no record contents. */
export function visibleLifeRecords(records: LifeRecord[], ctx: LifeContext): LifeRecord[] {
  if (!ctx.memberIds.includes(ctx.userId)) return [];
  const blockedFiles = new Set<string>();
  for (const r of records) if (r.kind === "capsule" && Date.parse(String(r.data.opensAt)) > Date.parse(ctx.now)) for (const fileId of (r.data.attachmentIds ?? []) as string[]) blockedFiles.add(fileId);
  return records.filter(r => r.spaceId === ctx.spaceId && !blockedFiles.has(r.id)).map(r => {
    const result = structuredClone(r);
    if (r.kind === "capsule" && Date.parse(String(r.data.opensAt)) > Date.parse(ctx.now)) {
      result.data = { title: r.data.title, opensAt: r.data.opensAt, locked: true };
      delete result.history;
    }
    if (r.kind === "question") {
      const answers = (r.data.answers ?? {}) as Record<string, string>;
      const revealed = ctx.memberIds.length === 2 && ctx.memberIds.every(m => Boolean(answers[m]));
      result.data = { ...r.data, locked: !revealed, answeredBy: Object.keys(answers).filter(m => ctx.memberIds.includes(m)), answers: revealed ? Object.fromEntries(ctx.memberIds.map(m => [m, answers[m]])) : answers[ctx.userId] ? { [ctx.userId]: answers[ctx.userId] } : {} };
      delete result.history;
    }
    return result;
  });
}

export function budgetForPlan(records: LifeRecord[], planId: string) {
  const plan = requireRecord(records, planId, "plan");
  let saved = 0; let spent = 0;
  const byMember: Record<string, { saved: number; spent: number }> = {};
  for (const record of records) {
    if (record.kind !== "transaction" || record.data.planId !== planId || record.data.currency !== plan.data.currency) continue;
    const amount = Number(record.data.amount);
    const member = byMember[record.createdBy] ?? { saved: 0, spent: 0 };
    if (record.data.type === "saving") { saved += amount; member.saved += amount; } else { spent += amount; member.spent += amount; }
    byMember[record.createdBy] = member;
  }
  if (![saved, spent].every(Number.isSafeInteger)) throw new LifeError("AMOUNT_OVERFLOW", "Сумма превышает допустимую точность");
  return { currency: String(plan.data.currency), target: Number(plan.data.target), saved, spent, remaining: saved - spent, byMember };
}

export const dailyQuestions = [
  "Какой маленький момент этой недели тебе хочется повторить?", "Как я могу сделать твой завтрашний день легче?", "Какое место ты хотел бы показать мне?", "Что из наших привычек тебе особенно дорого?", "Какой новый ритуал попробуем вместе?", "Как выглядел бы наш идеальный свободный вечер?", "Чему ты научился за последний месяц?", "Какое блюдо приготовим вместе впервые?", "За что ты сегодня благодарен себе?", "Какое воспоминание хочется сохранить?", "Как тебе удобнее просить о поддержке?", "Что помогает тебе восстанавливать силы?", "Какая небольшая мечта давно ждёт своего часа?", "Какую музыку включим на следующей прогулке?", "Что смешного ты вспоминаешь из детства?", "Какой день ты хотел бы прожить ещё раз?", "Какое совместное дело оказалось неожиданно приятным?", "Какой подарок без покупок тебя бы порадовал?", "Что мы давно собирались обсудить спокойно?", "Что нового о себе ты заметил в этом году?", "Какой маленький сюрприз порадует тебя на выходных?", "Какое занятие научим друг друга делать?", "Что ты хочешь отпраздновать на этой неделе?", "Какой маршрут для прогулки выберем?", "В какой момент ты почувствовал мою заботу?", "Какое фото лучше всего описывает наш месяц?", "Какой вопрос ты хотел бы задать мне?", "Что хочется попробовать, даже если не получится идеально?", "Какая общая традиция появится у нас через год?", "Что сегодня заставило тебя улыбнуться?", "Какое дело мы можем упростить вдвоём?",
] as const;

export function questionForDate(date: string) {
  const index = Math.floor(Date.parse(`${day.parse(date)}T00:00:00Z`) / 86400000);
  return dailyQuestions[((index % dailyQuestions.length) + dailyQuestions.length) % dailyQuestions.length]!;
}
