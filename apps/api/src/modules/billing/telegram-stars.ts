import type { CatalogItem } from "@wego/domain";

export interface StarsInvoiceInput {
  botToken: string;
  item: CatalogItem;
  payload: string;
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export async function createStarsInvoiceLink(input: StarsInvoiceInput): Promise<string> {
  if (!input.item.starsPrice) throw new Error("CATALOG_ITEM_NOT_AVAILABLE_FOR_STARS");
  const response = await (input.fetchImpl ?? fetch)(`${input.apiBaseUrl ?? "https://api.telegram.org"}/bot${input.botToken}/createInvoiceLink`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: input.item.title, description: input.item.description, payload: input.payload, currency: "XTR", prices: [{ label: input.item.title, amount: input.item.starsPrice }], provider_token: "" }),
  });
  const body = await response.json() as { ok?: boolean; result?: string; description?: string };
  if (!response.ok || !body.ok || !body.result) throw new Error(body.description ?? "TELEGRAM_INVOICE_FAILED");
  return body.result;
}

export function starsPurchasePayload(input: { purchaseId: string; userId: string; itemId: string; spaceId: string | null; recipientUserId?: string | null }): string {
  const payload = ["wego", input.purchaseId, input.userId, input.itemId, input.spaceId ?? "none"];
  if (input.recipientUserId) payload.push(input.recipientUserId);
  return payload.join(":");
}

export function parseStarsPurchasePayload(payload: string): { purchaseId: string; userId: string; itemId: string; spaceId: string | null; recipientUserId?: string } | null {
  const [prefix, purchaseId, userId, itemId, spaceId, recipientUserId] = payload.split(":");
  if (prefix !== "wego" || !purchaseId || !userId || !itemId) return null;
  return { purchaseId, userId, itemId, spaceId: spaceId === "none" ? null : spaceId ?? null, ...(recipientUserId ? { recipientUserId } : {}) };
}
