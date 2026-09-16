import { describe, expect, it } from "vitest";
import { createTelegramInitData, validateTelegramInitData } from "./telegram-auth";

describe("Telegram initData validation", () => {
  it("accepts data signed with the bot token", () => {
    const initData = createTelegramInitData({ id: 42, first_name: "Ильяс" }, "bot-secret", new Date("2026-08-27T10:00:00Z"));
    expect(validateTelegramInitData(initData, "bot-secret", new Date("2026-08-27T10:01:00Z"))).toEqual({ id: 42, first_name: "Ильяс" });
  });

  it("rejects stale or tampered data", () => {
    const initData = createTelegramInitData({ id: 42, first_name: "Ильяс" }, "bot-secret", new Date("2026-08-25T10:00:00Z"));
    expect(() => validateTelegramInitData(initData, "bot-secret", new Date("2026-08-27T10:01:00Z"))).toThrow("TELEGRAM_AUTH_EXPIRED");
    const fresh = createTelegramInitData({ id: 42, first_name: "Ильяс" }, "bot-secret", new Date("2026-08-27T10:00:00Z"));
    expect(() => validateTelegramInitData(fresh.replace(/hash=[^&]+/, "hash=00"), "bot-secret", new Date("2026-08-27T10:01:00Z"))).toThrow("TELEGRAM_AUTH_INVALID");
  });
});
