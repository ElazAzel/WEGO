# Real Telegram Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the local demo path with a real Telegram-authenticated WEGO product where two Telegram users can create/join one persistent space, see each other, invite each other, and share correctly synchronized Wego/world/check-in data.

**Architecture:** Keep the domain reducer as the single source of truth for world actions. Move production identity, sessions, spaces, invites, check-ins, economy, and world snapshots behind a persistence boundary backed by the existing PostgreSQL schema; keep the existing memory adapter for tests and local demo development. Make the web client treat Telegram as a real authenticated entry point when a production API URL is configured, accept `startapp=join_<token>`, hydrate only server data for an authenticated space, and refresh through SSE with conflict recovery.

**Tech Stack:** React 19, Zustand, Vite, Telegram Web Apps, Fastify 5, Zod, PostgreSQL/`pg`, existing `@wego/domain` reducers, Vitest.

**Spec:** `docs/deploy-telegram.md`, existing DB migrations in `packages/db/migrations/`, and the user acceptance criteria in this task.

## Global Constraints

- A production Telegram launch must not silently fall back to demo data when the API is configured.
- Never trust client-supplied `actorId`, reward amounts, Telegram identity, or partner identity.
- All writes must be idempotent and safe across process restarts and two simultaneous users.
- Partner check-in notes remain hidden until both participants reveal.
- Preserve the existing local-first demo only for explicit local development/test mode.
- Validate every user-visible flow with typecheck, targeted tests, production build, and live endpoint checks before claiming completion.

---

### Task 1: Lock down the failure modes with regression tests

**Files:**
- Create: `apps/web/src/lib/invite-flow.test.ts`
- Modify: `apps/api/src/server.test.ts`
- Modify: `apps/web/src/lib/api-client.test.ts` if the existing test file is present

**Interfaces:**
- Consumes: `getStartParam`, `isApiEnabled`, `authenticateTelegram`, `/v1/invitations/:token/accept`.
- Produces: executable tests proving production Telegram mode is enabled, join links are token-based, and local demo state is not used after remote hydration.

- [ ] **Step 1: Write failing tests** for start parameter parsing, the production API switch, and server-side invitation acceptance by a second authenticated user.
- [ ] **Step 2: Run only these tests** with `pnpm --filter @wego/api test -- server.test.ts` and `pnpm --filter @wego/web test -- invite-flow.test.ts`; record the current failures.
- [ ] **Step 3: Keep the tests focused** on observable contracts: no implementation snapshots and no assertions on private maps.
- [ ] **Step 4: Re-run after each implementation task** so failures identify the next missing behavior.

### Task 2: Add a persistence boundary for identity, sessions, spaces, invites, and check-ins

**Files:**
- Create: `apps/api/src/persistence/core-repository.ts`
- Modify: `apps/api/src/persistence/repository.ts`
- Modify: `apps/api/src/persistence/memory.ts`
- Modify: `apps/api/src/persistence/postgres.ts`
- Modify: `apps/api/src/server.ts`
- Test: `apps/api/src/server.test.ts`

**Interfaces:**
- Produces `CoreRepository` methods: `upsertTelegramUser`, `getUser`, `getSession`, `putSession`, `deleteSession`, `getActiveSpaceForUser`, `getSpaceForUser`, `createSpace`, `saveSpace`, `createInvitation`, `consumeInvitation`, `getCheckin`, `saveCheckin`, `getToday`, `listStories`, `saveStory`, and `getSpaceMembers`.
- The memory implementation uses the current test maps; the PostgreSQL implementation uses `users`, `sessions`, `spaces`, `space_members`, `invitations`, `daily_checkins`, and `story_entries` from migrations `0001_core.sql` and `0003_economy_guardrails.sql`.

- [ ] **Step 1: Define the repository contracts** with concrete domain-safe types and no `any` return values.
- [ ] **Step 2: Implement the memory adapter** and preserve current test behavior, including deterministic local user `tg-0`.
- [ ] **Step 3: Implement PostgreSQL queries** with transactions for session creation, space creation, invite consumption, check-in upsert, and story insert; hash session tokens and invite tokens before storage.
- [ ] **Step 4: Replace server auth and space/check-in/story helpers** with repository calls; remove the production dependency on process-local `users`, `sessions`, `spaces`, `checkins`, and `stories` maps.
- [ ] **Step 5: Add tests** for restart-safe sessions, second-user invite acceptance, full-space rejection, expired invites, duplicate check-ins, and hidden partner notes.

### Task 3: Make world state shared, durable, and conflict-safe

**Files:**
- Create: `apps/api/src/persistence/world-repository.ts`
- Modify: `apps/api/src/world/world-state.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `apps/web/src/store/use-app-store.ts`
- Modify: `apps/web/src/lib/world-sync.ts`
- Test: `apps/api/src/world/world-state.test.ts`
- Test: `apps/api/src/server.test.ts`

**Interfaces:**
- `WorldRepository.read(spaceId) -> Promise<{ world: WorldSnapshot; revision: number }>`.
- `WorldRepository.execute(spaceId, command) -> Promise<WorldMutation>` using `world_snapshots` and `world_commands` from migrations `0002_living_world_economy.sql` and `0004_shared_world.sql`.
- `WorldRepository.replace(spaceId, world, expectedRevision) -> Promise<WorldMutation>`.

- [ ] **Step 1: Keep the reducer pure** and test that duplicate command IDs replay the same result, stale revisions return the current world, and actor IDs are taken from the session.
- [ ] **Step 2: Implement the memory world repository** for existing tests.
- [ ] **Step 3: Implement PostgreSQL optimistic concurrency** with one transaction: lock the snapshot row, replay an existing command, reject a stale revision, reduce the action, update the snapshot, insert the command, and append a journal event.
- [ ] **Step 4: Update web synchronization** so an optimistic action is replaced by the authoritative response; on `409`, hydrate the server snapshot and show a recoverable toast instead of silently leaving divergent local rewards.
- [ ] **Step 5: Persist economy and reward idempotency** through `spark_wallets`, `spark_ledger`, `daily_earn_totals`, and `reward_action_guards`; reward only the server-accepted command.

### Task 4: Finish the Telegram account and partner invite flow

**Files:**
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/lib/telegram.ts`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/features/onboarding/OnboardingPage.tsx`
- Create: `apps/web/src/features/account/AccountGate.tsx`
- Modify: `apps/web/src/features/settings/SettingsPage.tsx`
- Test: `apps/web/src/lib/invite-flow.test.ts`

**Interfaces:**
- `acceptInvite(token: string): Promise<RemoteSpace>` posts to `/invitations/:token/accept`.
- `getStartParam()` returns only a normalized `join_<token>` value.
- `App` authenticates once, accepts an invite before bootstrap when present, then hydrates `me`, `space`, `partner`, `today`, `story`, `world`, and `worldRevision`.

- [ ] **Step 1: Remove the production ambiguity**: `isApiEnabled()` is true when the build has an API URL and `VITE_API_ENABLED=true`; if Telegram is present but configuration is missing, render a clear setup/error state instead of demo account data.
- [ ] **Step 2: Parse `startapp=join_<token>` and accept it exactly once** using session storage for the in-flight marker, then refresh bootstrap.
- [ ] **Step 3: Add account UI** showing Telegram first name/avatar when available, the real space name, partner state (`ещё не подключён` or partner name), and a logout/reconnect action.
- [ ] **Step 4: Replace the demo partner action** with a real invite/share action using `openTelegramShare`; no route may call `setPartnerDemo` in production.
- [ ] **Step 5: Add explicit loading, empty, and error states** for unauthenticated web access, invite expiry, full spaces, missing partner, and API outage.

### Task 5: Correct check-in, Wego actions, and rewards in the client

**Files:**
- Modify: `apps/web/src/store/use-app-store.ts`
- Modify: `apps/web/src/features/home/CheckinSheet.tsx`
- Modify: `apps/web/src/features/home/HomePage.tsx`
- Modify: `apps/web/src/features/world/LivingRoomScene.tsx`
- Modify: `apps/web/src/features/world/PixiRoomScene.tsx`
- Modify: `apps/web/src/features/world/GameHud.tsx`
- Modify: `apps/web/src/features/together/TogetherPage.tsx`
- Test: `apps/web/src/store/use-app-store.test.ts`

**Interfaces:**
- Remote check-in commands use `/spaces/:spaceId/checkins/me`, `/spaces/:spaceId/checkins/me/guess`, `/spaces/:spaceId/today`, and `/spaces/:spaceId/reveals/:date`.
- World actions return authoritative `{ world, revision, reward, message }`; the client never awards Sparks merely because an optimistic reducer returned a reward.

- [ ] **Step 1: Write tests** for one check-in reward, duplicate submission, partner check-in visibility, one reward per accepted world command, and no partner demo data in remote mode.
- [ ] **Step 2: Route check-in submit/guess/reveal through the API** when remote mode is active; keep the reducer only for instant UI preview until the response arrives.
- [ ] **Step 3: Reconcile authoritative wallet/world data** after accepted actions and never double-credit local and server rewards.
- [ ] **Step 4: Fix Wego interaction targets** so Pixi and layered fallback call the same action contract, disable a hotspot while a command is pending, and display server messages/rewards.
- [ ] **Step 5: Replace misleading “партнёр уже здесь” demo copy** with presence derived from the bootstrap/event state.

### Task 6: UX/UI repair pass based on the actual product states

**Files:**
- Modify: `apps/web/src/components/layout/AppShell.tsx`
- Modify: `apps/web/src/features/home/HomePage.tsx`
- Modify: `apps/web/src/features/onboarding/OnboardingPage.tsx`
- Modify: `apps/web/src/features/settings/SettingsPage.tsx`
- Modify: `apps/web/src/styles/globals.css`
- Modify: affected feature CSS/components after route audit

**Interfaces:**
- All primary routes must render a consistent shell with visible loading/error/empty states, reachable controls, and Telegram-safe viewport behavior.

- [ ] **Step 1: Capture the current local and production-like screens** for onboarding, empty partner, active partner, Wego room, settings, and failure states; use these captures as evidence for each UI change.
- [ ] **Step 2: Fix hierarchy and copy**: one primary action per screen, clear status for partner connection, no fake data labels hidden from the user, and no dead controls.
- [ ] **Step 3: Fix visual defects** from the console evidence: public asset URLs, missing favicon/fonts, broken room props, overflow, disabled/loading affordances, and touch target sizes.
- [ ] **Step 4: Run route smoke tests** at mobile viewport with keyboard and Telegram theme variables enabled.

### Task 7: Production configuration, deployment, and verification

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `apps/web/.env.example`
- Modify: `apps/api/.env.example`
- Modify: `README.md`
- Create or modify: API hosting configuration appropriate to the selected host

**Interfaces:**
- Web production variables: `VITE_API_ENABLED=true`, `VITE_API_URL=https://<api-host>/v1`, `VITE_TELEGRAM_BOT_USERNAME=wego_app_bot`.
- API production variables: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME=wego_app_bot`, `NOTE_ENCRYPTION_KEY`, `TELEGRAM_WEBHOOK_SECRET`, and `WEB_ORIGIN=https://elazazel.github.io`.

- [ ] **Step 1: Run migrations against the production database** and verify `/readyz` reports PostgreSQL.
- [ ] **Step 2: Deploy the API** only after its host and database are available; configure CORS and Telegram webhook from the verified HTTPS API URL.
- [ ] **Step 3: Build Pages with the real API URL** and verify the generated bundle does not contain local-only fallback account/partner data.
- [ ] **Step 4: Test two Telegram accounts**: owner creates a space, invitee joins from `startapp`, both see the same partner/world/check-in state, and a restart preserves the session.
- [ ] **Step 5: Run `pnpm --filter @wego/api test`, `pnpm --filter @wego/web test`, `pnpm typecheck`, and production builds; record any external deployment credential still required.
