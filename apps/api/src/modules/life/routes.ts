import type { FastifyInstance } from "fastify";
import { LifeCommandSchema, LifeError, applyLifeCommand, visibleLifeRecords, type LifeContext, type LifeRecord } from "@wego/domain";
import { z } from "zod";
import { ApiError } from "../../errors";
import type { Store, Transaction } from "../../persistence/repository";

type LifeRouteContext = {
  store: Store;
  userId(request: unknown): string;
  requireSpace(tx: unknown, spaceId: string, userId: string): Promise<{ id: string; members: string[]; timezone: string }>;
};
const envelope = z.object({ commandId: z.string().trim().min(1).max(120), command: z.unknown() }).strict();
const spaceParam = z.object({ spaceId: z.string().min(1).max(120) });
function mapError(error: unknown): never { if (error instanceof LifeError) throw new ApiError(error.status, error.code, error.message); if (error instanceof z.ZodError) throw new ApiError(422, "VALIDATION_ERROR", "Проверьте данные формы", error.flatten()); throw error; }
function collection(spaceId: string) { return `life:${spaceId}`; }
function receipts(spaceId: string) { return `receipts:${spaceId}`; }
async function records(tx: Transaction, spaceId: string) { return tx.list<LifeRecord>(collection(spaceId)); }

export function registerLifeRoutes(app: FastifyInstance, context: LifeRouteContext) {
  app.get("/v1/spaces/:spaceId/life", async request => {
    const { spaceId } = spaceParam.parse(request.params);
    const userId = context.userId(request);
    const result = await context.store.transaction(userId, async tx => {
      const space = await context.requireSpace(tx, spaceId, userId);
      const current = await records(tx, spaceId);
      const ctx: LifeContext = { userId, spaceId, memberIds: space.members, now: new Date().toISOString() };
      return { records: visibleLifeRecords(current, ctx) };
    });
    const changes = await context.store.changes(spaceId, "0", userId);
    return { ...result, cursor: changes.cursor };
  });
  app.post("/v1/spaces/:spaceId/life/commands", async request => {
    try {
      const { spaceId } = spaceParam.parse(request.params);
      const { commandId, command: rawCommand } = envelope.parse(request.body);
      const command = LifeCommandSchema.parse(rawCommand);
      const userId = context.userId(request);
      return await context.store.transaction(userId, async tx => {
        const space = await context.requireSpace(tx, spaceId, userId);
        const receiptCollection = receipts(spaceId);
        const oldReceipt = await tx.get<{ records: LifeRecord[]; deleted: string[] }>(receiptCollection, commandId);
        if (oldReceipt) return { ...oldReceipt, replayed: true };
        const current = await records(tx, spaceId);
        const ctx: LifeContext = { userId, spaceId, memberIds: space.members, now: new Date().toISOString() };
        const result = applyLifeCommand(current, command, ctx);
        for (const changed of result.changed) await tx.put(collection(spaceId), changed.id, changed);
        for (const deleted of result.deleted) await tx.delete(collection(spaceId), deleted);
        for (const changed of result.changed) await tx.append(spaceId, `${changed.kind}_changed`, changed.id, changed.revision);
        for (const deleted of result.deleted) await tx.append(spaceId, "record_deleted", deleted, 1);
        const response = { records: visibleLifeRecords(result.records, ctx), deleted: result.deleted };
        await tx.put(receiptCollection, commandId, response);
        return { ...response, replayed: false };
      });
    } catch (error) { return mapError(error); }
  });
}
