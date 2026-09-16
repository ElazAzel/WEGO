import { describe, expect, it, vi } from "vitest";
import { catalogItem } from "./catalog";
import { createStarsInvoiceLink, parseStarsPurchasePayload, starsPurchasePayload } from "./telegram-stars";
import { hasValidWebhookSecret, successfulPaymentFrom } from "./telegram-webhook";
import { resolveRegionTier, resolveStarsPrice } from "./regional-pricing";

describe("Telegram Stars billing boundary", () => {
  it("creates an XTR invoice with a server-owned price", async () => {
    const item = catalogItem("sticker-pack-cozy")!;
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: "https://t.me/$invoice" }), { status: 200 }));
    const url = await createStarsInvoiceLink({ botToken: "bot", item, payload: starsPurchasePayload({ purchaseId: "p1", userId: "u1", itemId: item.id, spaceId: null }), apiBaseUrl: "https://telegram.test", fetchImpl });
    expect(url).toContain("invoice");
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body.currency).toBe("XTR");
    expect(body.prices[0].amount).toBe(25);
    expect(body.provider_token).toBe("");
  });

  it("parses an idempotent payload and validates webhook secret", () => {
    const payload = starsPurchasePayload({ purchaseId: "p1", userId: "u1", itemId: "i1", spaceId: "s1" });
    expect(parseStarsPurchasePayload(payload)).toEqual({ purchaseId: "p1", userId: "u1", itemId: "i1", spaceId: "s1" });
    expect(hasValidWebhookSecret("secret", "secret")).toBe(true);
    expect(hasValidWebhookSecret("other", "secret")).toBe(false);
    expect(successfulPaymentFrom({ message: { successful_payment: { invoice_payload: payload, telegram_payment_charge_id: "charge-1" } } })?.telegramPaymentChargeId).toBe("charge-1");
  });

  it("uses a Central Asia pricing tier without trusting a client-provided price", () => {
    const item = catalogItem("sticker-pack-cozy")!;
    expect(resolveRegionTier("kk")).toBe("C");
    expect(resolveRegionTier("ru")).toBe("B");
    expect(resolveStarsPrice(item, "C")).toBe(13);
  });

  it("keeps gifting encoded in the server-owned Stars payload", () => {
    const payload = starsPurchasePayload({ purchaseId: "p-gift", userId: "u1", itemId: "sticker-pack-cozy", spaceId: "s1", recipientUserId: "u2" });
    expect(parseStarsPurchasePayload(payload)).toMatchObject({ purchaseId: "p-gift", recipientUserId: "u2" });
  });
});
