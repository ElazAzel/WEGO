import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramInitUser { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; }

function signature(dataCheckString: string, botToken: string): string {
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  return createHmac("sha256", secret).update(dataCheckString).digest("hex");
}

export function createTelegramInitData(user: TelegramInitUser, botToken: string, now: Date): string {
  const params = new URLSearchParams({ auth_date: String(Math.floor(now.getTime() / 1000)), user: JSON.stringify(user) });
  const dataCheckString = Array.from(params.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join("\n");
  params.set("hash", signature(dataCheckString, botToken));
  return params.toString();
}

export function validateTelegramInitData(initData: string, botToken: string, now = new Date()): TelegramInitUser {
  const params = new URLSearchParams(initData);
  const suppliedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  if (!suppliedHash || !Number.isFinite(authDate)) throw new Error("TELEGRAM_AUTH_INVALID");
  if (Math.abs(now.getTime() / 1000 - authDate) > 24 * 60 * 60) throw new Error("TELEGRAM_AUTH_EXPIRED");
  params.delete("hash");
  const dataCheckString = Array.from(params.entries()).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => `${key}=${value}`).join("\n");
  const expectedHash = signature(dataCheckString, botToken);
  const left = Buffer.from(suppliedHash, "hex"); const right = Buffer.from(expectedHash, "hex");
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("TELEGRAM_AUTH_INVALID");
  const user = JSON.parse(params.get("user") ?? "null") as TelegramInitUser | null;
  if (!user || typeof user.id !== "number" || typeof user.first_name !== "string") throw new Error("TELEGRAM_AUTH_INVALID");
  return user;
}
