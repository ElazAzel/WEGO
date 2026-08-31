# WEGO Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести hi-fi прототип WEGO в production-ready Telegram Mini App для двух связанных пользователей.

**Architecture:** Типизированный monorepo на React/Vite для Mini App и Node/Fastify API с общим доменным пакетом. PostgreSQL хранит данные, SSE синхронизирует партнёра, IndexedDB обеспечивает offline queue.

**Tech Stack:** TypeScript, React, Vite, Tailwind CSS, Zustand, TanStack Query, Zod, Vitest, Testing Library, Playwright, Fastify, Drizzle ORM, PostgreSQL, `idb`, Telegram Web App SDK, Lucide React, `html-to-image`.

**Spec:** `README.md`

## Global Constraints

- Целевая платформа первого релиза: Telegram Mini App; нативные iOS/Android клиенты остаются второй итерацией.
- Продукт — приватное игровое пространство для двух близких людей, а не трекер отношений.
- Ядро продукта: Check-in → Guess → Reveal → Story → Share.
- Все цвета, типографика, отступы, радиусы, тени и микро-анимации из прототипа считать hi-fi reference; при противоречии верным считать прототип.
- Ассеты `assets/wego/` и `assets/rooms/` использовать as-is; тень рендерить CSS `drop-shadow`, не запекать в PNG.
- Production-шрифты self-host: Instrument Serif Regular/Italic и Geist 400/500/600/700.
- Check-in состоит из четырёх шагов: mood, energy, want, optional note; первые три шага требуют выбора.
- Имя Wego: от 1 до 24 символов; note: не более 240 символов и с видимым счётчиком.
- Reveal становится доступным только после ответа обоих участников за один и тот же день.
- Share Cards экспортируются в PNG 1080×1920 с watermark `wego` внизу.
- Dev-only style tumbler, phone frame, demo seed partner и showcase-копии не попадают в production bundle.
- Secrets, Telegram bot token и ключ шифрования не попадают во frontend bundle, git или логи.

## Исходное состояние и обязательные выводы аудита

Проект в текущей директории — дизайн-хендофф: `WEGO Prototype.html` подключает React/Babel с CDN, `app.jsx` строит design canvas, `components/wego-state.jsx` хранит demo state в `localStorage`, а `components/screens/` содержит визуальные экраны. В корне нет `package.json`, lockfile, TypeScript, router, backend, database, тестов, CI/CD или Telegram auth.

Production нельзя получать простой упаковкой этих файлов. Нужно оставить их референсом и создать новое приложение. Критичные расхождения, которые должны быть покрыты задачами ниже:

1. `OnboardingFilmstrip` объявлен, но не монтируется; type/name не сохраняются, invite URL и copy action захардкожены.
2. `LivePrototype.guessDone` всегда открывает Reveal, даже если партнёр не ответил.
3. Partner answers, даты и seed Story находятся в `defaultState`; нет server truth, нового дня и realtime.
4. Story передаёт no-op `onOpenShare`; PNG export отсутствует.
5. Together хранит только id и не показывает «Запланировано»; вкладка «Мы» имеет неработающие кнопки.
6. Share cards содержат статические «28 дней», имена и даты; onboarding продублирован в `app.jsx`.
7. Нет accessibility, loading/empty/error states, reduced-motion fallback, offline queue и защиты приватных note.

## Архитектурные решения для старта

- React + Vite + TypeScript; Fastify + TypeScript; PostgreSQL + Drizzle; общий `@wego/domain`.
- Home V1 Room-first — default; V2 Character-first — настройка. Reveal V1 — default; V2 Envelope — feature flag.
- Default art style — A; B доступен в settings. Production убирает `StyleTumbler` из prototype canvas.
- Invite: `https://t.me/<configured-bot>/app?startapp=join_<opaque-token>`; сервер хранит hash token, срок жизни 7 дней и single-use membership.
- День определяется timezone пространства; submit после полуночи относится к новому дню, старый день immutable.
- Evolution: `egg → baby` после 3 подряд дней с mood `{good, great}` у обоих; `baby → adult` после 7 подряд таких дней. Правила живут в domain config.
- Note шифруется AES-256-GCM server-side; это не E2E. До Reveal note партнёра API не возвращает.
- Analytics — allowlisted PostHog events без notes, Telegram ids, tokens и raw partner answers.
- Все mutations idempotent по `clientMutationId`.

## Целевая структура файлов

```text
apps/web/src/{app,components,features,lib,store,styles}
apps/api/src/{plugins,modules,realtime,jobs,security}
packages/domain/src/{types,constants,validation,dates,reveal,evolution,insights}
packages/ui/src/{WButton,WChip,WCard,WAvatar,BottomSheet,TabBar,Icon,FormField}
packages/db/src/{client,schema,queries}
db/migrations/
tests/e2e/
docs/architecture/
```

## Task 0: Bootstrap monorepo и повторяемый toolchain

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.env.example`
- Create: `apps/web/package.json`, `apps/api/package.json`, `packages/domain/package.json`, `packages/ui/package.json`, `packages/db/package.json`
- Create: `docs/architecture/README.md`
- Preserve: `WEGO Prototype.html`, `app.jsx`, `components/`, `assets/`

**Interfaces:** root scripts `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`; aliases `@wego/domain`, `@wego/ui`, `@wego/db`.

- [ ] **Step 1: Закрепить toolchain.** Использовать Node 20 LTS, pnpm 9, TypeScript strict, ESLint, Prettier, Vitest и Playwright. Production packages не используют `any`.
- [ ] **Step 2: Настроить workspace scripts.** `pnpm dev` запускает web/api, `pnpm build` собирает оба, `pnpm test` запускает unit/integration tests, `pnpm test:e2e` запускает Playwright.
- [ ] **Step 3: Проверить чистый bootstrap.** Run: `corepack enable; pnpm install --frozen-lockfile; pnpm typecheck; pnpm lint; pnpm test; pnpm build`. Expected: все команды PASS, web создаёт `apps/web/dist`.
- [ ] **Step 4: Commit.** `git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore .editorconfig .env.example apps packages docs/architecture/README.md; git commit -m "chore: bootstrap wego production workspace"`.

## Task 1: Вынести доменную модель, справочники и бизнес-правила

**Files:**
- Create: `packages/domain/src/types.ts`, `constants.ts`, `validation.ts`, `dates.ts`, `reveal.ts`, `evolution.ts`, `insights.ts`, `index.ts`
- Test: `packages/domain/src/*.test.ts`

**Interfaces:** `MoodId`, `EnergyId`, `WantId`, `SpaceType`, `WegoStage`, `StoryType`, `CheckinInput`, `RevealViewModel`, `validateCheckin`, `validateSpaceName`, `getSpaceDate`, `canReveal`, `buildRevealViewModel`, `calculateEvolution`, `deriveInsight`.

- [ ] **Step 1: Описать typed model.**

  ```ts
  export type MoodId = "great" | "good" | "calm" | "normal" | "overloaded" | "hard" | "irritated";
  export type EnergyId = "high" | "mid" | "low";
  export type WantId = "together" | "talk" | "rest" | "alone" | "fun" | "walk" | "support";
  export type StoryType = "reveal" | "evolution" | "result" | "activity" | "note";
  export interface CheckinInput { mood: MoodId; energy: EnergyId; want: WantId; note: string; clientMutationId: string; }
  ```

- [ ] **Step 2: Перенести справочники.** Сохранить 7 mood, 3 energy и 7 want из `components/design-system.jsx`; tone/icon key должны быть единственным источником для всех экранов.
- [ ] **Step 3: Написать failing tests.** Проверить name 0/1/24/25 chars, note 240/241 chars, invalid enum, `canReveal` с отсутствующим partner answer, guess correctness и timezone date boundary.
- [ ] **Step 4: Реализовать чистые функции и прогнать.** Run: `pnpm --filter @wego/domain test -- --run`. Expected: PASS без React/browser imports.
- [ ] **Step 5: Commit.** `git add packages/domain; git commit -m "feat: add typed wego domain rules"`.

## Task 2: Перенести дизайн-систему в доступный UI-kit

**Files:**
- Create: `apps/web/src/styles/tokens.css`, `globals.css`, `animations.css`, `components/AssetImage.tsx`
- Create: `packages/ui/src/WButton.tsx`, `WChip.tsx`, `WCard.tsx`, `WAvatar.tsx`, `BottomSheet.tsx`, `TabBar.tsx`, `Icon.tsx`, `FormField.tsx`, `index.ts`
- Test: `packages/ui/src/*.test.tsx`

**Interfaces:** `WButton({ variant, size, loading, disabled })`, `WChip({ tone, active, onClick })`, `WCard({ tone })`, `WAvatar({ name, tone, size, alt })`, `BottomSheet({ open, onClose, title, height })`, `TabBar({ current, onChange })`.

- [ ] **Step 1: Перенести exact tokens.** Цвета, Instrument Serif/Geist, scale, radii, shadows и gradients берутся из README и `components/design-system.jsx`; шрифты self-host в `apps/web/public/fonts/`.
- [ ] **Step 2: Добавить motion/accessibility.** CSS `:active`, `:focus-visible`, `aria-pressed`, native disabled, Escape/focus trap/restore focus для sheet, `100dvh` safe area и reduced-motion для `wgFloat`, `wgSeal`, slide-up.
- [ ] **Step 3: Заменить Unicode.** `IconName = wego | we | together | story | copy | share | close | check | arrow-right`; SVG 24×24, stroke 1.5px, `currentColor`.
- [ ] **Step 4: Написать component tests.** Проверить role/button, `aria-pressed`, keyboard activation, focus return, Escape, disabled/loading and 44px touch target.
- [ ] **Step 5: Verify/commit.** Run: `pnpm --filter @wego/ui test -- --run; pnpm --filter web build`. Expected: PASS. Commit `git add packages/ui apps/web/src/styles apps/web/src/components/AssetImage.tsx; git commit -m "feat: add accessible wego design system"`.

## Task 3: PostgreSQL schema, auth и API foundation

**Files:**
- Create: `packages/db/src/schema.ts`, `client.ts`, `queries.ts`; `drizzle.config.ts`; `db/migrations/*`; `docker-compose.yml`
- Create: `apps/api/src/config.ts`, `server.ts`, `plugins/auth.ts`, `plugins/errors.ts`, `plugins/rate-limit.ts`
- Create: `apps/api/src/modules/{auth,spaces,invitations,checkins,reveals,story,activities,questions}/routes.ts`
- Test: `apps/api/src/modules/**/*.int.test.ts`

**Interfaces:** `/v1/auth/telegram`, `/v1/bootstrap`, `/v1/spaces`, `/v1/spaces/:id/invitations`, `/v1/invitations/:token/accept`, `/v1/spaces/:id/today`, `/checkins/me`, `/checkins/me/guess`, `/reveals/:date`, `/reveals/:date/story`, `/activities`, `/questions/daily`.

- [ ] **Step 1: Создать tables.** `users`, `spaces`, `space_members`, `invitations`, `daily_checkins`, `story_entries`, `activity_catalog`, `planned_activities`, `daily_questions`, `question_answers`, `who_votes`, `analytics_events`; constraints `(space_id, local_date, user_id)`, `(space_id, user_id)` and idempotent source key.
- [ ] **Step 2: Реализовать Telegram auth.** Validate `initData` HMAC with bot token and age ≤24h, upsert user, issue rotating secure HttpOnly SameSite cookie. Не принимать Telegram id из JSON.
- [ ] **Step 3: Реализовать access/privacy services.** Every query checks membership; partner note/guess unavailable before Reveal; third member rejects 409; invite token is hashed and single-use.
- [ ] **Step 4: Добавить Zod route schemas/errors.** Error envelope `{ error: { code, message, requestId, details? } }`; statuses 401/403/404/409/422/429.
- [ ] **Step 5: Написать integration tests.** Проверить auth rejection, create/join, third-member conflict, partner note privacy, reveal 409/200 and duplicate mutation id.
- [ ] **Step 6: Run/commit.** Run: `docker compose up -d postgres; pnpm db:migrate; pnpm --filter api test -- --run`. Expected: fresh DB migration and tests pass twice. Commit `git add packages/db apps/api db docker-compose.yml drizzle.config.ts; git commit -m "feat: add postgres schema and api foundation"`.

## Task 4: Web shell, Telegram bootstrap и routing

**Files:**
- Create: `apps/web/src/app/App.tsx`, `router.tsx`, `pages/BootPage.tsx`, `NotFoundPage.tsx`
- Create: `apps/web/src/lib/telegram.ts`, `api-client.ts`, `query-client.ts`
- Create: `apps/web/src/store/use-ui-store.ts`
- Create: `apps/web/src/components/layout/{AppShell,PageHeader,LoadingState,ErrorState,EmptyStoryState}.tsx`
- Test: `apps/web/src/app/*.test.tsx`, `apps/web/src/lib/*.test.ts`

**Interfaces:** `getTelegramContext()`, `apiFetch<T>()`; routes `/onboarding`, `/onboarding/:step`, `/wego`, `/we`, `/together`, `/story`, `/join/:token`; modal query `?sheet=checkin|guess`, `?reveal=today`, `?share=<id>`.

- [ ] **Step 1: Инициализировать SDK.** `ready()`, `expand()`, header/background colors, guarded `disableVerticalSwipes()`; local mock adapter for tests. Добавить guarded `HapticFeedback.impactOccurred("light")` для успешных CTA/выбора и `notificationOccurred("error")` для ошибок, с no-op вне Telegram.
- [ ] **Step 2: Реализовать bootstrap.** POST initData to auth, GET bootstrap, redirect to onboarding when no space, `/wego` when space exists; preserve `/join/:token` across auth/refresh.
- [ ] **Step 3: Собрать full viewport shell.** Remove `WPhoneFrame` from production; use `100dvh`, safe-area, one scroll container, one overlay portal, TabBar only with active space.
- [ ] **Step 4: Add states.** Home skeleton with peach diorama, retryable error and exact empty Story copy/CTA.
- [ ] **Step 5: Verify.** Run: `pnpm --filter web test -- --run; pnpm --filter web build`. Expected: mock auth redirects correctly and unknown route renders NotFound.

## Task 5: Onboarding и invite/join

**Files:**
- Create: `apps/web/src/features/onboarding/OnboardingPage.tsx`, `onboarding-schema.ts`, `use-onboarding.ts`
- Create: `apps/web/src/features/onboarding/steps/{SplashStep,TypeStep,NameStep,InviteStep,RevealStep}.tsx`
- Modify: `apps/api/src/modules/spaces/routes.ts`, `invitations/routes.ts`
- Test: `apps/web/src/features/onboarding/*.test.tsx`, `apps/api/src/modules/invitations/*.int.test.ts`

**Interfaces:** `useOnboarding()` state `{ step, type, name, inviteUrl, createdSpaceId }`; create space `{ name, type, style, timezone, clientMutationId }`; invite `{ url, expiresAt }`; accept returns `{ space, partner }`.

- [ ] **Step 1: Перенести пять hi-fi screens.** Устранить дубли из `app.jsx`; progress 5 segments, exact copy/assets, radio/chips, final step refreshes bootstrap and navigates `/wego`.
- [ ] **Step 2: Shared draft and validation.** Type/name живут в parent hook; trim/name 1–24; draft в session/IndexedDB, server space создаётся один раз на final submit.
- [ ] **Step 3: Real clipboard/share.** Copy opaque server URL через Clipboard API; fallback selectable text; token никогда не генерируется только в браузере.
- [ ] **Step 4: Join rules.** Creator cannot accept own invite; same user retry idempotent; third member 409; token expires in 7 days.
- [ ] **Step 5: Tests.** Проверить disabled name CTA, step persistence, API failure retry, creator/partner/third user and reload.
- [ ] **Step 6: E2E.** Run: `pnpm exec playwright test tests/e2e/onboarding.spec.ts`. Expected: creator creates space, partner joins, third user sees conflict.

## Task 6: Home V1/V2 и Check-in → Guess

**Files:**
- Create: `apps/web/src/features/home/{HomePage,HomeV1,HomeV2,ParticipantMini,StatusPill}.tsx`
- Create: `apps/web/src/features/checkin/{CheckinSheet,GuessSheet}.tsx`, `checkin-schema.ts`, `use-checkin-flow.ts`
- Modify: `apps/api/src/modules/checkins/routes.ts`
- Test: `apps/web/src/features/{home,checkin}/*.test.tsx`, `tests/e2e/checkin.spec.ts`

**Interfaces:** `HomePage({ variant })`, `CheckinSheet({ open, onClose, onComplete })`, `GuessSheet({ open, onClose, onDone })`, `useCheckinFlow(): closed|checkin|guess|reveal-or-wait`.

- [ ] **Step 1: Build Home from server query.** V1 default; V2 setting; partner-not-joined/offline banner; reveal CTA only when domain `canReveal(today)`; no demo default.
- [ ] **Step 2: Build four-step sheet.** Mood/want chips, energy radio, note `maxLength=240` + counter; CTA disabled semantically until first three choices.
- [ ] **Step 3: Optimistic mutation/rollback.** Update own cache, send `clientMutationId`, close after 260ms, open Guess; on failure restore draft/cache and show retry.
- [ ] **Step 4: Correct gate.** After Guess save, open Reveal only when both moods exist; otherwise Home shows `Ждём вас обоих`; backend remains authority.
- [ ] **Step 5: Tests/E2E.** Run: `pnpm exec playwright test tests/e2e/checkin.spec.ts --project=mobile-chrome`. Expected: 4 steps, validation, timings 260/400ms, no early Reveal, reload persistence.

## Task 7: Reveal and Story

**Files:**
- Create: `apps/web/src/features/reveal/{RevealPage,RevealV1,RevealV2,RevealCard,MoodFace,reveal-copy}.tsx`
- Create: `apps/web/src/features/story/{StoryPage,StoryItem,StoryShareDialog}.tsx`
- Modify: `apps/api/src/modules/{reveals,story}/routes.ts`
- Test: `apps/web/src/features/{reveal,story}/*.test.tsx`, `tests/e2e/reveal-story.spec.ts`

**Interfaces:** `RevealPage({ variant, date })` consumes `RevealViewModel`; `POST /reveals/:date/story` idempotently returns `StoryEntry`; `StoryPage.onOpenShare(storyId)` is mandatory, no no-op.

- [ ] **Step 1: Handle locked/error data.** 409 renders locked/retry; network/500 renders `Не открылось. Попробовать снова?`; missing partner values never dereferenced.
- [ ] **Step 2: Implement V1.** Preserve lilac gradient, cards, insight, guess result, Wego reaction and primary/secondary CTAs from reference.
- [ ] **Step 3: Implement V2 flag.** Exact 0/400/1400ms phases, cleanup timers; reduced-motion/low-performance falls back to V1.
- [ ] **Step 4: Idempotent Story save.** Disable while saving, use reveal date/source id, update cache and navigate Story; repeated tap makes one entry.
- [ ] **Step 5: Story states.** Newest first, 5 types, empty state, selected record opens share dialog.
- [ ] **Step 6: Verify.** Run: `pnpm exec playwright test tests/e2e/reveal-story.spec.ts`. Expected: privacy, gate, guess copy, V2 timing and duplicate prevention pass.

## Task 8: Together и «Мы»

**Files:**
- Create: `apps/web/src/features/together/{TogetherPage,ActivityCard,PlannedActivities}.tsx`
- Create: `apps/web/src/features/we/{WePage,DailyQuestionCard,WhoOfUsCard,WeResults}.tsx`
- Create: `apps/api/src/modules/{activities,questions}/service.ts`
- Modify: `apps/api/src/modules/{activities,questions}/routes.ts`
- Test: `apps/web/src/features/{together,we}/*.test.tsx`, `tests/e2e/together-we.spec.ts`

- [ ] **Step 1: Seed catalog.** Перенести 6 current activities и README examples; normalize tags `home/outdoor/quick/romance/games`, keep Russian labels.
- [ ] **Step 2: Activities.** GET catalog; POST/DELETE plan idempotent; optimistic rollback; planned section above catalog and persists reload.
- [ ] **Step 3: Daily question.** One deterministic space-local question/day; own answer hidden until both answer; result can save Story `result`.
- [ ] **Step 4: Who-of-us.** One vote/user, two avatar buttons, results hidden until both vote, consensus creates one Story result.
- [ ] **Step 5: Verify.** Run: `pnpm exec playwright test tests/e2e/together-we.spec.ts`. Expected: filters, plan state, privacy gate and result persistence pass.

## Task 9: Share Cards and PNG export

**Files:**
- Create: `apps/web/src/features/share/ShareCardDialog.tsx`, `export-share-card.ts`, `share-types.ts`
- Create: `apps/web/src/features/share/cards/{ShareCardShell,EvolutionCard,ResultCard,MemoryCard}.tsx`
- Modify: `apps/web/src/features/story/StoryShareDialog.tsx`
- Test: `apps/web/src/features/share/*.test.tsx`, `tests/e2e/share-export.spec.ts`

**Interfaces:** `ShareCardData` derives from Story/reveal; `exportShareCard(node,{width:1080,height:1920}): Promise<Blob>`; `shareBlob` returns `shared|downloaded`.

- [ ] **Step 1: Build data-driven templates.** Evolution lilac, Result yellow, Memory peach; actual Wego/name/date/title/body; no hardcoded demo data; line-clamp long Russian text.
- [ ] **Step 2: Deterministic render.** Fixed 1080×1920 node, await images/fonts, same-origin assets, verify PNG dimensions and type.
- [ ] **Step 3: Fallbacks.** Use `navigator.canShare`/`share` for files; otherwise download; Telegram path must remain reliable without silent upload of private content.
- [ ] **Step 4: Test export.** Assert PNG and dimensions `{ width: 1080, height: 1920 }`, selected Story maps to correct template and watermark is present.
- [ ] **Step 5: E2E.** Run: `pnpm exec playwright test tests/e2e/share-export.spec.ts`. Expected: export/download/share and overflow checks pass.

## Task 10: SSE realtime, offline queue и day rollover

**Files:**
- Create: `apps/api/src/realtime/{sse,events}.ts`, `jobs/day-rollover.ts`
- Create: `apps/web/src/lib/{offline-queue,realtime}.ts`, `hooks/useSpaceEvents.ts`
- Modify: `apps/api/src/modules/{checkins,reveals,story}/service.ts`
- Test: server realtime/job tests, queue tests, `tests/e2e/realtime-offline.spec.ts`

**Interfaces:** `GET /v1/spaces/:spaceId/events` emits `{ type, spaceId, date, version }`; `OfflineQueue.enqueue()`/`flush()`; `getSpaceDate(now, timezone)` is sole date authority.

- [ ] **Step 1: Emit post-commit SSE events.** Authorize membership, heartbeat 25s, backoff 1/2/4/8/30s, invalidate today/Story/activity queries by event type.
- [ ] **Step 2: IndexedDB queue.** Queue check-in/guess/plan/Story mutations in order; `clientMutationId`; flush on online; keep validation/conflict failures for visible retry.
- [ ] **Step 3: Day rollover.** Close prior date, recalculate streak, emit `day_changed`, clear only new today fields; never copy private answers.
- [ ] **Step 4: Test boundaries.** `23:59:59` belongs old date, `00:00:00` new; old-date retry returns 409 `DAY_CLOSED`; offline mutation syncs once.
- [ ] **Step 5: Two-client E2E.** Run: `pnpm exec playwright test tests/e2e/realtime-offline.spec.ts`. Expected: partner answer unlocks without refresh, reconnect and offline recovery pass.

## Task 11: Evolution, insights, settings и analytics

**Files:**
- Create: `apps/api/src/modules/evolution/service.ts`, `apps/web/src/features/settings/{SettingsPage,StyleSettings}.tsx`, `apps/web/src/lib/analytics.ts`, `apps/api/src/modules/analytics/routes.ts`
- Modify: `packages/domain/src/{evolution,insights}.ts`, Home/Reveal components
- Test: evolution/insights/analytics tests

- [ ] **Step 1: Atomic evolution.** Use exact 3/7 streak rules; stage transition and one evolution Story entry in one transaction; rerun does not duplicate.
- [ ] **Step 2: Deterministic insights.** Rule table: same mood, different energy + same want, neutral fallback; only mood/energy/want ids drive text.
- [ ] **Step 3: Settings.** Move A/B and Home V1/V2 to settings; remove reset/force Reveal/StyleTumbler from user UI; V2 flag is config-controlled.
- [ ] **Step 4: Allowlisted analytics.** Emit after successful mutation/transition; strip notes, tokens, Telegram ids and raw partner answers; test invalid submit not counted.
- [ ] **Step 5: Verify.** Run: `pnpm test -- --run`. Expected: streak, idempotency, insights and privacy tests PASS.

## Task 12: Security, privacy, accessibility and performance

**Files:**
- Create: `docs/architecture/security.md`, `privacy.md`, `apps/api/src/security/{crypto,redaction}.ts`
- Modify: auth/rate-limit, global CSS and all sheet/modal components
- Test: `apps/api/src/security/*.test.ts`, `tests/e2e/accessibility.spec.ts`, `performance.spec.ts`

- [ ] **Step 1: Harden auth/mutations.** Origin validation, session rotation, auth/invite/checkin rate limits, body limits, strict CORS/CSP, secure headers, no token in logs.
- [ ] **Step 2: Encrypt notes.** AES-256-GCM random IV, authTag/keyVersion, rotation path; redact note/initData from logs, analytics, traces.
- [ ] **Step 3: Accessibility.** Labels/roles, focus restore, Escape, visible focus, 44px targets, contrast, reduced motion and screen-reader status.
- [ ] **Step 4: Performance.** Preload only selected asset, lazy-load inactive tabs/share dialog, avoid all PNGs on first load; profile V2 on throttled Android.
- [ ] **Step 5: Verify.** Run: `pnpm exec playwright test tests/e2e/accessibility.spec.ts tests/e2e/performance.spec.ts`. Expected: no critical/serious axe findings, no blocking console errors, FCP target <2.5s on CI profile.

## Task 13: CI/CD, deployment и runbooks

**Files:**
- Create: `.github/workflows/ci.yml`, `deploy-web.yml`, `deploy-api.yml`
- Create: `apps/web/Dockerfile`, `apps/api/Dockerfile`, hosting routing config
- Create: `docs/architecture/deployment.md`, `docs/runbooks/recovery.md`
- Modify: `apps/api/src/server.ts` with `/healthz` and `/readyz`

- [ ] **Step 1: CI.** Frozen install, typecheck, lint, unit/integration tests with ephemeral PostgreSQL, builds and Playwright smoke.
- [ ] **Step 2: Deploy one trusted origin.** HTTPS; `/` web, `/v1/*` API; secrets `TELEGRAM_BOT_USERNAME`, `TELEGRAM_BOT_TOKEN`, `DATABASE_URL`, `NOTE_ENCRYPTION_KEY`, `POSTHOG_KEY` only in secret manager.
- [ ] **Step 3: Migrations/backups.** One-shot migration job; deploy stops on failure; daily backup and restore test; key rotation/invite invalidation documented.
- [ ] **Step 4: Observability.** requestId logs, error tracking redaction, metrics auth failures, checkin success, reveal 409s, SSE connections, queue depth and export failures.
- [ ] **Step 5: Staging smoke.** `pnpm ci:verify` must cover create/join, both check-ins, Reveal, Story, activity, question, PNG, refresh and offline retry.

## Task 14: Acceptance, rollout и prototype cleanup

**Files:**
- Create: `docs/qa/acceptance-matrix.md`, `docs/qa/manual-test-script.md`
- Modify: `README.md` with production architecture link, preserving design handoff
- Production imports exclude `app.jsx`, `components/device-frame.jsx`, `components/design-system-showcase.jsx`; original bundle/assets stay as reference

- [ ] **Step 1: Составить acceptance matrix.** Cover onboarding, invite, Home variants, all Check-in validations, Guess privacy, locked/unlocked Reveal, Story, Together, Мы, PNG, offline/reconnect, new day and evolution.
- [ ] **Step 2: Visual compare.** Capture 390×844 content viewport and compare tokens, typography, asset crop, radius, CTA, tabbar safe area and animation phases against prototype.
- [ ] **Step 3: Manual Telegram matrix.** Android/iOS/Desktop Telegram, cold start, back button, clipboard/share fallback, network loss, duplicate taps, expired invite, second account.
- [ ] **Step 4: Flagged rollout.** Internal allowlist → 10% new spaces → 100%; monitor join, checkin, reveal, Story, share success, errors/support. Keep V2 Reveal off until performance passes.
- [ ] **Step 5: Completion gate.** No production route reads `wego-mvp-state-v1`; no demo partner/date/forced Reveal/no-op callback; all CI/release checks green.

## Definition of Done

- Telegram user creates a space through five onboarding screens; partner joins; third user receives conflict.
- Check-in persists mood/energy/want/note, note is capped at 240, Guess remains private, Reveal unlocks only for two same-day answers.
- Partner updates arrive via SSE; offline mutations sync exactly once; Story save and evolution are idempotent.
- Together and Мы persist answers and reveal results only after both participants answer.
- Share cards export 1080×1920 PNG with current data and watermark.
- Day rollover preserves Story, starts clean `today`, and applies evolution rules.
- `pnpm typecheck`, `pnpm lint`, unit/integration/e2e tests and production build pass; no critical accessibility findings.
- Secrets and notes are excluded from frontend bundle, analytics and logs; runbooks cover migrations, restore, key rotation and Telegram token rotation.

## Порядок выполнения

Выполнять Tasks 0 → 14. Tasks 1–3 формируют домен и API contract; Tasks 4–9 создают MVP пользовательского пути; Tasks 10–13 добавляют reliability/security/release; Task 14 проводит финальную визуальную и операционную приёмку. Не начинать массовую полировку экранов до зелёных тестов domain/API.
