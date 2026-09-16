# WEGO deployment

## Local

1. Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN` and a 32-byte base64 `NOTE_ENCRYPTION_KEY` for API work.
2. Start PostgreSQL with `docker compose up -d postgres`.
3. Install with the pinned pnpm toolchain and run `pnpm typecheck`, `pnpm test`, and `pnpm build`.
4. Run the web preview with `pnpm dev`; run the API separately from `apps/api` after building.

## Production topology

Use one HTTPS origin: the web app serves `/`, and the API is routed under `/v1/*`. PostgreSQL is private to the API. Telegram points the Mini App to the trusted web origin. Sessions are HttpOnly and cookies are Secure in production.

Required server secrets:

- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_TOKEN`
- `DATABASE_URL`
- `NOTE_ENCRYPTION_KEY`
- optional `POSTHOG_KEY`

Deploy order: migrate database, deploy API, run health/ready checks, deploy web, then execute the staging smoke flow. Keep Reveal V2 behind a flag until mobile performance is measured.
