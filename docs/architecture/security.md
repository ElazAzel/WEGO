# WEGO security baseline

## Trust boundaries

- Telegram `initData` is validated only on the API with the bot token; the client never sends a Telegram user id as an authority.
- Every space-scoped read and mutation checks membership before accessing data.
- Invite URLs contain opaque random tokens; only SHA-256 token hashes belong in persistence.
- The current local adapter keeps state in memory for development. It must not be used for production data.

## Private notes

Notes are encrypted with AES-256-GCM on the API before persistence. Each value has a random 12-byte IV, authentication tag, and key version. The encryption key is supplied through `NOTE_ENCRYPTION_KEY`; the development fallback exists only for local tests.

Before Reveal, a partner response excludes the note and guess. After both same-day check-ins exist, Reveal may return both notes to an authorized member.

## Operational rules

- Never log `initData`, bearer/cookie sessions, invite tokens, notes, raw Telegram ids, or raw partner answers.
- Keep `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `NOTE_ENCRYPTION_KEY`, and analytics keys server-side.
- Use HTTPS, secure HttpOnly sessions, strict origin/CORS policy, request body limits, rate limits, and a restrictive CSP in deployment.
- Rotate the note key by versioned decrypt-then-re-encrypt migration; invalidate outstanding invites after an incident.
