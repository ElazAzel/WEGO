import { afterEach, describe, expect, it, vi } from "vitest";
import { buildServer } from "./server";

afterEach(() => vi.unstubAllEnvs());
describe("production startup guard", () => {
  for (const missing of ["DATABASE_URL", "TELEGRAM_BOT_TOKEN", "NOTE_ENCRYPTION_KEY", "TELEGRAM_WEBHOOK_SECRET"]) {
    it(`fails production construction without ${missing}`, () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DATABASE_URL", "postgres://unused:unused@127.0.0.1:1/unused");
      vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-token");
      vi.stubEnv("NOTE_ENCRYPTION_KEY", Buffer.alloc(32, 2).toString("base64"));
      vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "test-webhook");
      vi.stubEnv(missing, "");
      expect(() => buildServer()).toThrow(missing);
    });
  }
  it("rejects an invalid encryption key before serving", () => {
    vi.stubEnv("NOTE_ENCRYPTION_KEY", "invalid");
    expect(() => buildServer()).toThrow("NOTE_ENCRYPTION_KEY");
  });
});
