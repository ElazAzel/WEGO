import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface QueuedMutation { id: string; method: "POST" | "PUT" | "DELETE"; path: string; body?: unknown; createdAt: number; attempts: number; }
interface WegoQueueDB extends DBSchema { mutations: { key: string; value: QueuedMutation; indexes: { "by-created": number } } }

export function getRetryDelay(attempt: number): number { return Math.min(1000 * (2 ** attempt), 30000); }

async function database(): Promise<IDBPDatabase<WegoQueueDB>> { return openDB<WegoQueueDB>("wego-offline-queue", 1, { upgrade(db) { const store = db.createObjectStore("mutations", { keyPath: "id" }); store.createIndex("by-created", "createdAt"); } }); }

export class OfflineQueue {
  async enqueue(mutation: Omit<QueuedMutation, "attempts">): Promise<void> { const db = await database(); await db.put("mutations", { ...mutation, attempts: 0 }); }
  async list(): Promise<QueuedMutation[]> { const db = await database(); return db.getAllFromIndex("mutations", "by-created"); }
  async flush(send: (mutation: QueuedMutation) => Promise<void>): Promise<void> { const db = await database(); for (const mutation of await this.list()) { try { await send(mutation); await db.delete("mutations", mutation.id); } catch { await db.put("mutations", { ...mutation, attempts: mutation.attempts + 1 }); break; } } }
}
