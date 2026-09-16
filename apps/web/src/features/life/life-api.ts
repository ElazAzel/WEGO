import { useCallback, useEffect, useMemo, useState } from "react";
import type { LifeRecord } from "@wego/domain";
import { apiFetch, isApiEnabled } from "../../lib/api-client";
import { useAppStore } from "../../store/use-app-store";

const now = "2026-09-15T10:00:00.000Z";
const seed: LifeRecord[] = [
  { id: "plan-japan", spaceId: "local", kind: "plan", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Япония · октябрь", type: "trip", currency: "EUR", target: 500000, status: "open", description: "Наша поездка" } },
  { id: "transaction-japan", spaceId: "local", kind: "transaction", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { planId: "plan-japan", type: "saving", amount: 240000, currency: "EUR", date: "2026-09-10", description: "Первый взнос" } },
  { id: "task-tickets", spaceId: "local", kind: "task", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Проверить билеты", planId: "plan-japan", assigneeId: null, due: "2026-09-20", status: "open", repeat: "none", description: "" } },
  { id: "task-passport", spaceId: "local", kind: "task", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Проверить паспорта", planId: "plan-japan", assigneeId: "local-preview", due: "2026-09-18", status: "open", repeat: "none", description: "" } },
  { id: "task-dinner", spaceId: "local", kind: "task", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Забронировать ужин", assigneeId: "partner-preview", due: "2026-09-21", status: "open", repeat: "none", description: "" } },
  { id: "event-anniversary", spaceId: "local", kind: "calendar", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Наша годовщина", start: "2026-10-12T19:00:00+05:00", end: "2026-10-12T22:00:00+05:00", allDay: false, timezone: "Asia/Almaty", repeat: "yearly", reminderMinutes: 1440, exceptionDates: [] } },
  { id: "wish-camera", spaceId: "local", kind: "wish", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Камера для поездки", amount: 180000, currency: "RUB", priority: "high", fulfilled: false } },
  { id: "note-recipe", spaceId: "local", kind: "note", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Паста на двоих", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Паста, сливки, грибы и много пармезана." }] }] }, folder: "Рецепты", tags: ["ужин", "любимое"], attachmentIds: [] } },
  { id: "note-trip", spaceId: "local", kind: "note", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Что взять в поездку", content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Паспорта · зарядки · удобная обувь · плед." }] }] }, folder: "Поездки", tags: ["Япония"], attachmentIds: [] } },
  { id: "card-pyat", spaceId: "local", kind: "card", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Пятёрочка", code: "46005170", format: "ean8", offline: true } },
  { id: "card-coffee", spaceId: "local", kind: "card", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Кофейня рядом", code: "880012345678", format: "code128", offline: true } },
  { id: "question-week", spaceId: "local", kind: "question", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Какой маленький момент этой недели хочется повторить?", date: "2026-09-15", options: ["Спокойный вечер дома", "Прогулка без телефонов", "Спонтанная поездка"], answers: {} } },
  { id: "capsule-2027", spaceId: "local", kind: "capsule", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Письмо нам в 2027", body: "Что мы обязательно должны помнить об этом времени?", opensAt: "2027-01-01T00:00:00.000Z", attachmentIds: [] } },
  { id: "memory-first-trip", spaceId: "local", kind: "memory", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: "Наш первый спокойный вечер", body: "Чай, музыка и ощущение, что никуда не нужно спешить.", date: "2026-09-12", album: "2026", attachmentIds: [] } },
];

function mergeWithPreview(remote: LifeRecord[], fallback: LifeRecord[]): LifeRecord[] {
  const remoteIds = new Set(remote.map(record => record.id));
  return [...remote, ...fallback.filter(record => !remoteIds.has(record.id))];
}

function localStorageKey(spaceId: string): string { return `wego-life-records-v1:${spaceId}`; }

function readLocalRecords(spaceId: string, fallback: LifeRecord[]): LifeRecord[] {
  try {
    const raw = window.localStorage.getItem(localStorageKey(spaceId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? mergeWithPreview(parsed as LifeRecord[], fallback) : fallback;
  } catch { return fallback; }
}

function writeLocalRecords(spaceId: string, records: LifeRecord[]): void {
  try { window.localStorage.setItem(localStorageKey(spaceId), JSON.stringify(records)); } catch { /* storage is optional */ }
}

export function useLifeRecords(kind?: LifeRecord["kind"]) {
  const space = useAppStore(s => s.space);
  const previewRecords = useMemo(() => seed.filter(r => !kind || r.kind === kind), [kind]);
  const spaceId = space?.id ?? "local";
  const [records, setRecords] = useState<LifeRecord[]>(() => readLocalRecords(spaceId, previewRecords));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isApiEnabled()) return;
    setRecords(readLocalRecords(spaceId, previewRecords));
  }, [kind, previewRecords, spaceId]);
  useEffect(() => {
    if (!isApiEnabled()) writeLocalRecords(spaceId, records);
  }, [records, spaceId]);
  useEffect(() => {
    if (!isApiEnabled() || !space?.id) return;
    let active = true;
    void apiFetch<{ records: LifeRecord[] }>(`/spaces/${space.id}/life`).then(result => { if (active) setRecords(mergeWithPreview(result.records.filter(r => !kind || r.kind === kind), previewRecords)); }).catch(() => undefined);
    return () => { active = false; };
  }, [kind, previewRecords, space?.id]);
  type ClientCommand = { type: "put"; id: string; kind: string; data: unknown; expectedRevision?: number } | { type: "delete" | "claimTask" | "complete" | "convertWish"; id: string; planId?: string; expectedRevision?: number } | { type: "answer"; id: string; answer: string; expectedRevision?: number };
  const command = useCallback(async (value: ClientCommand) => {
    setBusy(true);
    try {
      const current = records.find(record => record.id === value.id);
      const isPreviewRecord = current?.spaceId === "local" && current.createdBy === "local-preview";
      if (!isApiEnabled() || !space?.id || isPreviewRecord) {
        setRecords(current => {
          if (value.type === "delete") return current.filter(r => r.id !== value.id);
          if (value.type === "complete" || value.type === "claimTask") return current.map(r => r.id === value.id ? { ...r, revision: r.revision + 1, data: { ...r.data, ...(value.type === "complete" ? { status: "done" } : { assigneeId: "local-preview" }) } } : r);
          if (value.type === "put") { const existing = current.find(r => r.id === value.id); const record: LifeRecord = { id: value.id, spaceId, kind: value.kind as LifeRecord["kind"], revision: (existing?.revision ?? 0) + 1, createdBy: existing?.createdBy ?? "local-preview", createdAt: existing?.createdAt ?? now, updatedAt: now, data: value.data as Record<string, unknown> }; return existing ? current.map(r => r.id === value.id ? record : r) : [...current, record]; }
          if (value.type === "answer") return current.map(r => r.id === value.id ? { ...r, revision: r.revision + 1, data: { ...r.data, answers: { ...((r.data.answers ?? {}) as Record<string, string>), "local-preview": value.answer } } } : r);
          if (value.type === "convertWish") {
            const wish = current.find(r => r.id === value.id);
            if (!wish) return current;
            const plan: LifeRecord = { id: value.planId ?? `plan-${Date.now()}`, spaceId, kind: "plan", revision: 1, createdBy: "local-preview", createdAt: now, updatedAt: now, data: { title: wish.data.title, type: "goal", currency: wish.data.currency ?? "RUB", target: wish.data.amount ?? 0, status: "open", description: "Создано из желания", wishId: wish.id, attachmentIds: [] } };
            return [...current.map(r => r.id === wish.id ? { ...r, revision: r.revision + 1, data: { ...r.data, planId: plan.id } } : r), plan];
          }
          return current;
        });
        return;
      }
      const result = await apiFetch<{ records: LifeRecord[] }>(`/spaces/${space.id}/life/commands`, { method: "POST", body: JSON.stringify({ commandId: crypto.randomUUID(), command: { ...value, expectedRevision: value.expectedRevision ?? records.find(r => r.id === value.id)?.revision ?? 0 } }) });
      setRecords(mergeWithPreview(result.records.filter(r => !kind || r.kind === kind), previewRecords));
    } finally { setBusy(false); }
  }, [kind, previewRecords, records, space?.id, spaceId]);
  return { records, busy, command };
}

export function useSpaceDate(): string { const timezone = useAppStore(s => s.space?.timezone ?? "Asia/Almaty"); return new Intl.DateTimeFormat("ru-RU", { timeZone: timezone, day: "numeric", month: "long", year: "numeric" }).format(new Date()); }
