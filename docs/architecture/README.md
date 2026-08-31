# WEGO production architecture

Production code lives under `apps/` and `packages/`. The original `WEGO Prototype.html`, `app.jsx`, `components/` and `assets/` remain a visual reference. `@wego/domain` is the shared source of truth for enums, validation, day boundaries, reveal gating, insights and evolution rules.

Current implementation status: the typed web shell, accessible UI kit, local-first MVP flow, Fastify API foundation, Telegram HMAC validation, encrypted notes, SSE event hub, offline queue, migration schema, unit/API tests and Playwright smoke flow are implemented. PostgreSQL query wiring, server bootstrap in the web client, full multi-client sync, production sessions, analytics and deployment automation remain the next hardening phase.

See [`security.md`](security.md), [`privacy.md`](privacy.md), [`deployment.md`](deployment.md), [`../qa/acceptance-matrix.md`](../qa/acceptance-matrix.md), and [`../qa/manual-test-script.md`](../qa/manual-test-script.md).
