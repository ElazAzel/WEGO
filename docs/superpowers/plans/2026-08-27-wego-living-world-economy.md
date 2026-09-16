# WEGO Living World & Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform WEGO from a static mood/check-in screen into a small living shared world with an animated transparent Wego character, room interactions, shared plans and memories, earnable Sparks, catalog entitlements, and a Telegram Stars payment path that is safe to operate and test locally, while upgrading the web app to React 19 without changing the existing visual language.

**Architecture:** Keep the existing local-first React/Vite shell and Fastify API. Add a pure domain layer for world actions, rewards, wallet ledger, catalog and entitlements; add a PixiJS scene adapter inside the existing Home surface; persist a compact world snapshot in the current store; expose economy and billing through versioned API modules; keep Telegram payment fulfillment server-authoritative and idempotent. The first release uses the existing room art as a background and newly generated transparent sprites/assets as foreground layers.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Fastify, Zod, PixiJS 8, Motion, Vitest, Playwright, Telegram Mini Apps SDK primitives, Telegram Bot API Stars (`XTR`), existing CSS token system.

**Spec:** `docs/superpowers/specs/2026-08-27-wego-living-world-economy-design.md`

## Global Constraints

- Preserve the existing WEGO palette, rounded cards, warm room illustrations, typography scale, and Russian copy tone.
- Keep the app usable without Telegram and without the API by using the existing local-first preview path.
- Do not treat Telegram `initDataUnsafe` as trusted identity; only the server-validated session may authorize mutations or purchases.
- Never grant an entitlement from a client payment callback. Grant only from an idempotent server-side `successful_payment` update and record the Telegram charge identifiers.
- Do not overwrite existing room or character art. New generated assets must be transparent, visually compatible, and copied into a new versioned asset path only after inspection.
- Keep all economy mutations represented by an append-only ledger entry and make reward/action idempotency explicit.
- Do not expose real billing in local preview unless the required bot configuration is present; local billing tests use mocked Telegram responses.
- The repository has no Git metadata available in the workspace, so verification is performed with typecheck, lint, unit tests, build, and browser tests rather than commits.

---

## 1. Map the existing surfaces and establish the release checklist

- [ ] Read and record the existing Home, store, Telegram adapter, API server, domain package, UI package, and test entry points before changing them.

  **Files:** `apps/web/src/features/home/HomePage.tsx`, `apps/web/src/store/use-app-store.ts`, `apps/web/src/lib/telegram.ts`, `apps/api/src/server.ts`, `packages/domain/src/types.ts`, `packages/ui/src/index.ts`, `apps/web/src/**/*.test.*`, `apps/web/e2e/**/*`.

  **Verification:** confirm the current app can still be served at `/wego`, and record the baseline commands `pnpm --filter @wego/web typecheck`, `pnpm --filter @wego/web lint`, `pnpm --filter @wego/web test -- --run`, `pnpm --filter @wego/web build`.

## 2. Upgrade the web workspace to React 19

- [ ] Resolve the current compatible versions of React, React DOM, React types, Testing Library, PixiJS, `@pixi/react`, and Motion with the workspace package manager.

  **Files:** `apps/web/package.json`, `packages/ui/package.json`, `pnpm-lock.yaml`.

  **Implementation:** use the configured pnpm runtime to resolve compatible current packages, then pin the resulting semver ranges in the package manifests. Keep React and React DOM on the same major/minor line and move `@types/react` and `@types/react-dom` to 19-compatible ranges.

- [ ] Update the app entry and test setup for React 19 and remove any React 18-only assumptions.

  **Files:** `apps/web/src/main.tsx`, `apps/web/src/test/setup.ts`, `apps/web/src/**/*.test.*`, `packages/ui/src/**/*.tsx`.

  **Implementation:** retain `createRoot`, verify Strict Mode behavior, and fix any type errors caused by the React 19 JSX/type changes without changing runtime behavior.

  **Tests:** run web typecheck, lint, unit tests, and production build before adding game behavior.

## 3. Add pure domain contracts for world state and economy

- [ ] Add shared types and Zod schemas for Wego needs, actions, room objects, shared plans, memories, Sparks, catalog items, wallets, ledger entries, purchases, and entitlements.

  **Files:** `packages/domain/src/world.ts`, `packages/domain/src/economy.ts`, `packages/domain/src/index.ts`.

  **Interfaces:** `WegoNeed`, `WegoAction`, `RoomObjectState`, `WorldSnapshot`, `SharedPlan`, `MemoryEntry`, `SparkReason`, `LedgerEntry`, `CatalogItem`, `Purchase`, `Entitlement`.

- [ ] Implement deterministic reward and action reducers with explicit caps, cooldowns, and idempotency keys.

  **Files:** `packages/domain/src/world-reducer.ts`, `packages/domain/src/economy-reducer.ts`, `packages/domain/src/__tests__/world-reducer.test.ts`, `packages/domain/src/__tests__/economy-reducer.test.ts`.

  **Behavior:** actions such as feed, pet, play, tidy, decorate, outfit change, daily care, plan completion, and memory creation update the world snapshot and return a reward event; repeated action keys produce no duplicate reward; client input cannot choose the reward amount.

  **Tests:** cover initial state, need decay, valid transitions, cooldown rejection, daily cap, duplicate action key, negative/overflow amounts, and entitlement checks.

## 4. Create the persistent schema boundary for wallet and world data

- [ ] Extend the database metadata/schema with wallet, ledger, catalog, purchase, entitlement, world state, object state, plan, and memory tables.

  **Files:** `packages/db/src/schema.ts`, `packages/db/src/index.ts`, `packages/db/migrations/0002_living_world_economy.sql`.

  **Constraints:** unique `(user_id, idempotency_key)` for rewards, unique Telegram purchase identifiers, integer balances, immutable ledger rows, indexed space/user ownership, and no card/payment secrets in client-readable tables.

- [ ] Add repository interfaces that the current in-memory adapter and a future SQL adapter both satisfy.

  **Files:** `packages/domain/src/repositories.ts`, `apps/api/src/modules/economy/in-memory-economy-repository.ts`, `apps/api/src/modules/world/in-memory-world-repository.ts`.

  **Tests:** repository contract tests cover atomic debit/credit semantics, duplicate fulfillment, insufficient balance, and world snapshot versioning.

## 5. Generate and validate a transparent Wego sprite set

- [ ] Generate a small transparent foreground asset set compatible with the inspected room art: idle Wego, happy Wego, tired Wego, pet interaction pose, and one room prop pack.

  **Files:** generated into `apps/web/public/assets/wego/v2/` only after inspection; preserve `apps/web/public/assets/wego/style-a-*` and `apps/web/public/assets/rooms/*`.

  **Asset contract:** PNG with alpha, no baked room/background, centered full-body silhouette, consistent proportions, no text, no UI, and enough transparent margin for animation.

- [ ] Add an asset manifest and fallback mapping so missing generated assets never blank the room.

  **Files:** `apps/web/src/features/world/asset-manifest.ts`, `apps/web/src/features/world/asset-manifest.test.ts`.

  **Verification:** inspect generated images, check their dimensions/alpha channel, and verify the fallback to the existing character art in a browser.

## 6. Build the living room scene adapter

- [ ] Implement a PixiJS scene mounted inside the existing room card with layered background, props, Wego sprite, interaction hit areas, and reduced-motion support.

  **Files:** `apps/web/src/features/world/LivingRoomScene.tsx`, `apps/web/src/features/world/scene-manifest.ts`, `apps/web/src/features/world/pixi-runtime.ts`, `apps/web/src/styles/globals.css`.

  **Interactions:** tap Wego for pet, tap bowl for feed, tap toy for play, tap clutter for tidy, tap a decoration anchor for decorate; each action calls the local store action and renders an optimistic animation/toast.

  **Motion:** use Pixi ticker for sprite movement and ambient particles; use Motion for React overlays and sheets; pause or simplify animation when `prefers-reduced-motion` is enabled.

- [ ] Replace the opaque character overlay in Home with the scene while retaining the existing V1/V2 layout and accessibility labels.

  **Files:** `apps/web/src/features/home/HomePage.tsx`, `apps/web/src/features/home/HomePage.test.tsx`.

  **Acceptance:** the character no longer covers half of the room; the room remains visible; character has idle movement; each visible hit area has a keyboard-accessible fallback button; no interaction crashes when assets fail.

## 7. Extend local-first state into a shared living-world loop

- [ ] Add world snapshot, economy wallet, action log, plans, memories, outfit, unlocked items, and daily reward state to the Zustand store with versioned persistence migration.

  **Files:** `apps/web/src/store/use-app-store.ts`, `apps/web/src/store/store-migrations.ts`, `apps/web/src/store/use-app-store.test.ts`.

- [ ] Add game surfaces for HUD, care/action feedback, wardrobe, catalog, plan board, memory timeline, and paired mini-games.

  **Files:** `apps/web/src/features/world/GameHud.tsx`, `apps/web/src/features/world/ActionFeedback.tsx`, `apps/web/src/features/customization/WardrobeSheet.tsx`, `apps/web/src/features/shop/ShopSheet.tsx`, `apps/web/src/features/shared/PlanBoard.tsx`, `apps/web/src/features/memories/MemoryTimeline.tsx`, `apps/web/src/features/minigames/PairGameSheet.tsx`.

  **Behavior:** free actions earn Sparks within a daily cap; shared actions require both participants where appropriate; memories are created from completed plans and meaningful interactions; locked items explain how to unlock them rather than dead-ending.

## 8. Turn the existing UI package into the game design-system layer

- [ ] Add reusable tokens and primitives for Spark balance, need meter, action chip, unlock badge, rarity, reward toast, bottom sheet, room hotspot, avatar, and payment status.

  **Files:** `packages/ui/src/tokens.ts`, `packages/ui/src/game-components.tsx`, `packages/ui/src/index.ts`, `packages/ui/src/game-components.test.tsx`, `apps/web/src/styles/tokens.css`.

  **Constraint:** reuse existing surface, border, radius, shadow, typography, and color tokens; new components must work in both the current light room and Telegram theme variables.

## 9. Expand Telegram Mini App integration

- [ ] Extend the Telegram adapter with BackButton, theme/safe-area variables, haptics, start parameter, share link, write-access request, and invoice opening helpers.

  **Files:** `apps/web/index.html`, `apps/web/src/lib/telegram.ts`, `apps/web/src/lib/telegram.test.ts`, `apps/web/src/app/App.tsx`.

  **Security:** only send raw `initData` to the server for validation; never use `initDataUnsafe.user` for authorization or payment ownership.

- [ ] Route pairing and share actions through a Telegram-safe direct link with an opaque one-time invitation token and preserve a web fallback.

  **Files:** `apps/web/src/features/share/share-actions.ts`, `apps/web/src/features/home/HomePage.tsx`, `apps/api/src/server.ts`.

## 10. Implement Telegram Stars catalog and fulfillment

- [ ] Add catalog and wallet endpoints plus a server-side invoice service that creates Telegram invoice links in `XTR` only when billing is configured.

  **Files:** `apps/api/src/modules/billing/catalog.ts`, `apps/api/src/modules/billing/telegram-stars.ts`, `apps/api/src/modules/billing/billing-routes.ts`, `apps/api/src/server.ts`.

  **Endpoints:** `GET /v1/catalog`, `GET /v1/wallet`, `POST /v1/billing/invoices`, `GET /v1/purchases`.

  **Rules:** catalog price is read from server data; payload includes user, space, item, and unique order ID; local unconfigured mode returns a clear unavailable response instead of unlocking content.

- [ ] Add webhook handling for pre-checkout, successful payment, refunds, support, and idempotent entitlement granting.

  **Files:** `apps/api/src/modules/billing/telegram-webhook.ts`, `apps/api/src/modules/billing/telegram-webhook.test.ts`, `apps/api/src/server.ts`.

  **Rules:** verify the Telegram webhook secret, answer pre-checkout quickly, persist `telegram_payment_charge_id` and `telegram_payment_charge_id`-equivalent identifiers, grant exactly once, expose `/paysupport`, and log reconciliation-safe events without logging tokens.

- [ ] Connect ShopSheet to the invoice path and show payment state without claiming success before fulfillment.

  **Files:** `apps/web/src/features/shop/ShopSheet.tsx`, `apps/web/src/lib/api-client.ts`, `apps/web/src/features/shop/ShopSheet.test.tsx`.

## 11. Add API world synchronization and event delivery

- [ ] Add world bootstrap, action, plan, memory, wallet, and catalog routes backed by the repository interfaces.

  **Files:** `apps/api/src/modules/world/world-routes.ts`, `apps/api/src/modules/economy/economy-routes.ts`, `apps/api/src/server.ts`.

  **Endpoints:** `GET /v1/world`, `POST /v1/world/actions`, `POST /v1/plans`, `PATCH /v1/plans/:id`, `POST /v1/memories`, `GET /v1/wallet`, `GET /v1/catalog`.

- [ ] Extend the existing SSE stream with world, plan, memory, wallet, and entitlement events and reconcile optimistic local actions.

  **Files:** `apps/api/src/modules/events/event-bus.ts`, `apps/api/src/server.ts`, `apps/web/src/lib/api-client.ts`, `apps/web/src/app/App.tsx`.

## 12. Test the complete local flow and document operations

- [ ] Add unit tests for domain reducers, store migration, Telegram adapter, billing idempotency, catalog rules, and UI states.

  **Files:** the test files created above plus `apps/api/src/**/*.test.ts`.

- [ ] Add a Playwright flow covering `/wego`: load room, care for Wego, earn Sparks, open wardrobe/shop, create a shared plan, create a memory, and exercise the mocked local payment state.

  **Files:** `apps/web/e2e/living-world.spec.ts`, `apps/web/playwright.config.ts`.

- [ ] Run typecheck, lint, unit tests, production build, and Playwright against the local server; fix warnings that affect the release path.

  **Commands:** `pnpm --filter @wego/web typecheck`, `pnpm --filter @wego/web lint`, `pnpm --filter @wego/web test -- --run`, `pnpm --filter @wego/web build`, `pnpm --filter @wego/web test:e2e`.

- [ ] Document the local and Telegram production configuration, including bot token handling, webhook secret, catalog publishing, `/paysupport`, refund/reconciliation, and feature flags.

  **Files:** `docs/operations/telegram-stars.md`, `README.md`.

## Definition of Done

- React 19 is installed and the web app typechecks, lints, tests, builds, and serves at `/wego`.
- The room visibly contains an animated transparent Wego sprite with accessible interaction hotspots and a reduced-motion fallback.
- Care, customization, shared plans, mini-game actions, and memories have deterministic local-first behavior.
- Sparks are earned and spent through domain-validated ledger operations; duplicate action/payment events do not duplicate rewards or entitlements.
- Shop items have a server-controlled catalog and the Telegram Stars path is implemented behind configuration with mocked tests for invoice, pre-checkout, fulfillment, and refund/support handling.
- The current design language remains intact and new game components are driven by shared tokens.
