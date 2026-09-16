# WEGO implementation — 2026-09-15

Authority: the user-approved implementation plan in this task. Existing uncommitted room/world changes must be preserved. No publishing, production mutations or real-account verification is implied by local tests.

## Work queue

1. Production build, durable PostgreSQL/session foundation, worker/outbox, authorization.
2. Shared household entities and commands; connected application navigation and forms.
3. Calendar adapters, synchronization and delivery channels.
4. Notes/files/cards, gated intimacy/history and rule-based pet.
5. Operations, monetization safeguards, production and regression verification.

## Dependency checks

| Producer / consumer | Shared contract | Check |
| --- | --- | --- |
| Foundation / all modules | Authenticated user, active Space, transaction, revision, durable journal | Keep existing Space and SSE route; do not introduce Couple |
| Household / calendar | Canonical event vs task deadline projection | No automatic external copy of deadlines |
| Calendar / delivery | Durable outbox, expiry, retry and provider identity | Provider acknowledgement is not user delivery |
| Intimacy / cache, pet, journal | Actor-specific gated reads | No secret content in journal or pet context |
| All phases / release | Local verification vs real accounts/devices | External verification must remain an explicit release gate |

Ruling: work in the existing `codex/production-foundation` checkout and retain uncommitted changes — they contain the current shared-room implementation — a separate clean checkout would omit user work.
Ruling: no automatic commits — the dirty checkout includes user-owned edits that must not be accidentally attributed or captured.

## Status

The local vertical slice is implemented and verified. The current checkout includes:

- durable-store contracts with a PostgreSQL adapter, canonical foundation migration, transaction receipts, cursor-based journal and RLS tests;
- production-shaped session checks, logout/expiry, active-space and one-use invitation rules;
- shared life records for tasks, plans, wishes, calendar records, capsules and gated answers, with idempotent commands;
- connected web navigation for Мы / Календарь / Дела / Планы / Ещё, offline PWA shell, local preview seed and cross-device SSE catch-up;
- rule-based shared pet replies, three mini-game definitions and server-authoritative world revisions;
- calendar provider capability adapters, notification policy, worker entrypoint and release-oriented tests;
- production builds for API server/worker and web client.

The following remain explicit release gates rather than being faked locally: installing the production-only `pg`, `pg-boss` and `tsdav` packages when the package registry is available; real PostgreSQL/Railway/Supabase provisioning; OAuth credentials and verification for Google/Outlook; CalDAV app passwords for iCloud/Yandex; Telegram/web-push delivery credentials; real iOS/Android/Desktop device checks; and production backups/restore drills.
