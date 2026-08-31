export const config = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? "127.0.0.1",
  botToken: process.env.TELEGRAM_BOT_TOKEN ?? "local-bot-secret",
  botUsername: process.env.TELEGRAM_BOT_USERNAME ?? "wego_bot",
  noteEncryptionKey: process.env.NOTE_ENCRYPTION_KEY ?? Buffer.alloc(32, 7).toString("base64"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  telegramApiBaseUrl: process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org",
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  billingEnabled: process.env.TELEGRAM_BILLING_ENABLED === "true" && Boolean(process.env.TELEGRAM_BOT_TOKEN),
};
