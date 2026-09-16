# Task 1 — durable API foundation

Implement in the existing WEGO checkout, preserving existing dirty changes. Do not create commits, spawn subagents, install packages or modify package.json/lockfiles. Controller owns dependency installation and frontend/domain work.

Your write scope: apps/api/src (except new modules/life/, which controller owns), packages/db migrations/schema, docs/foundation-task-report.md. Read this first; it is your requirements.

Implement production persistence with PostgreSQL (pg driver), no production in-memory data/sessions. Retain existing Space/world and current API routes, backwards compatible buildServer() for tests. Keep memory adapter explicitly test/development only. Fail production startup without DATABASE_URL, Telegram token, encryption key and webhook secret; no empty initData login outside explicit demo/test. DB sessions hashed, expiry and revoke/logout, correct 401. Pair-only, one active Space, max2, transactional one-use expiring invites. Authoritative world time and actor from server. Refactor mutable global Maps into per-server repository with durable persistence and safe concurrent command/revision handling; don't serialize entire database into one JSON document or hold all business data in process. Canonical migrations packages/db/migrations, PostgreSQL RLS via transaction context and non-bypass role, private membership checks. Existing legacy tables may be reused or carefully augmented. No destructive migration.

Foundation contract for controller's separate household module:
- Export a repository module apps/api/src/persistence/repository.ts with types Store and Transaction.
- Store.transaction<T>(userId: string, work: (tx: Transaction) => Promise<T>): Promise<T>.
- Transaction.get<T>(collection:string,id:string):Promise<T|null>; put<T>(collection,id,value):Promise<void>; delete(collection,id):Promise<void>; list<T>(collection):Promise<T[]>.
- Collections for new business records are scoped by space, e.g. `life:${spaceId}`. Enforce membership before exposing these; RLS must independently scope records. Reserve system collections to internal API (client cannot choose arbitrary collection).
- Transaction journal append(spaceId:string,type:string,entityId:string,revision:number):Promise<void> stores ONLY metadata, durable increasing cursor. Transaction can persist command receipts atomically with business updates.
- Store changes(spaceId,cursor,userId) for journal catchup and durable SSE notification. Exact return interface document in report and inform controller early.
- Export registerLifeRoutes hook context in server.ts? Controller will add import/call after your work; expose buildServer's store and authorized helpers via named app decorations or use options module hooks. Preferred buildServer({ registerModules?: (app, {store, userId(request), requireSpace(tx,spaceId,userId)})=>void }) or straightforward exported module registration dependency function. Inform controller chosen contract before integration.

Add pg-boss worker entry apps/api/src/worker.ts, bounded retries/expiry outbox dispatcher and readiness actually checks DB. Use supported pg-boss API, inspect installed types. Durable transaction outbox first then dispatch queue idempotently, no fake successful external delivery. API and worker build handled by controller esbuild. Static serving same origin may be handled controller later.

Tests first and record expected failures before code; retain existing regressions. Use node node_modules/vitest/vitest.mjs directly if pnpm shim hangs. Dependencies pg, @types/pg, pg-boss will be installed by controller. A real PG may not be available yet; use PGlite adapter for repository SQL integration if feasible but don't claim full production PostgreSQL/pg-boss validation from mocks. Report exact remaining blockers instead of false completion.

Report to docs/foundation-task-report.md: implemented behavior, exact commands/results, changed files, contract, known gaps. Return a short status and paths.
