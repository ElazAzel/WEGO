import { timingSafeEqual } from "node:crypto";
import { parseStarsPurchasePayload } from "./telegram-stars";

export interface TelegramPaymentUpdate {
  pre_checkout_query?: { id: string; invoice_payload: string };
  message?: { successful_payment?: { invoice_payload: string; telegram_payment_charge_id: string; provider_payment_charge_id?: string } };
}

export function hasValidWebhookSecret(actual: string | undefined, expected: string): boolean {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual); const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function successfulPaymentFrom(update: TelegramPaymentUpdate) {
  const payment = update.message?.successful_payment;
  if (!payment) return null;
  const purchase = parseStarsPurchasePayload(payment.invoice_payload);
  return purchase ? { ...purchase, telegramPaymentChargeId: payment.telegram_payment_charge_id, telegramProviderChargeId: payment.provider_payment_charge_id ?? null } : null;
}

