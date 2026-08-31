# Cozy World First Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing WEGO room into a persistent, interactive social space with vibes, rituals, eight room objects, daily quest, shared memories, and an asynchronous pair game.

**Architecture:** Extend the serializable `WorldSnapshot` and its reducer first, then expose its commands through the Zustand store. The DOM layered scene remains the renderer: isolated sprite definitions drive object hit areas and visual layers, while bottom sheets provide focused controls. API commands retain local-first optimistic behavior and use a single action endpoint with typed domain actions.

**Tech Stack:** React 19, TypeScript, Zustand 5, Vitest, Testing Library, Fastify, Zod, CSS animations, Motion, built-in image generation for transparent PNG assets.

**Spec:** `docs/superpowers/specs/2026-08-28-cozy-world-expansion-design.md`

## Global Constraints

- Preserve the warm paper, coral/mint/yellow/lilac visual system and current mobile-first layout.
- Keep all world state JSON-serializable and safe to normalize from older snapshots.
- Use optimistic local updates; failed network sync must not erase a local action.
- Do not introduce a required game engine, websocket, or a new runtime dependency.
- Use separate transparent sprites and manifest entries; never add a new full-room character bitmap.
- Respect `prefers-reduced-motion`, keyboard access, aria labels, and 44px touch targets.
- Award Sparks only through existing daily cap and action guardrails.
- Premium cosmetics remain cosmetic; entitlement never changes needs, game outcomes, or memory eligibility.

---

## File structure

- `packages/domain/src/cozy-world.ts` — pure types, defaults, compatibility normalizers, memory copy and daily quest helpers.
- `packages/domain/src/world.ts` — incorporates Cozy World state into `WorldSnapshot` and validates new actions.
- `packages/domain/src/world-reducer.ts` — pure transitions for vibes, rituals, object interactions, pulse, game answer, and quest claim.
- `packages/domain/src/items.ts` — catalog entries for the new room cosmetics.
- `apps/web/src/store/use-app-store.ts` — local-first Cozy World commands and sync dispatch.
- `apps/web/src/features/world/cozy-world-manifest.ts` — visual metadata for the new interactive objects.
- `apps/web/src/features/world/SceneHotspot.tsx` — reusable accessible scene action button.
- `apps/web/src/features/world/CozyToast.tsx` — non-blocking action feedback.
- `apps/web/src/features/world/VibePickerSheet.tsx` — vibe selector and current atmosphere state.
- `apps/web/src/features/world/RitualSheet.tsx` — contextual character rituals.
- `apps/web/src/features/world/DailyQuestCard.tsx` — one daily quest and claim action.
- `apps/web/src/features/world/MemoryWall.tsx` — room layer and memory list UI.
- `apps/web/src/features/minigames/PairGameSheet.tsx` — replaces the linear local prompt with the asynchronous “Выбери вайб” game.
- `apps/web/src/features/world/LivingRoomScene.tsx` — composes visual state, prop layers, Wego state, hotspots, toast, and memory wall.
- `apps/web/src/features/world/GameHud.tsx` — opens the new entry points.
- `apps/web/src/store/use-ui-store.ts` and `apps/web/src/app/App.tsx` — new sheet route states and sheet mounting.
- `apps/web/src/styles/animations.css` and `apps/web/src/styles/globals.css` — animations, layout, responsive and reduced-motion styles.
- `apps/api/src/server.ts` — validates and applies new world actions under existing authentication.
- `apps/web/public/assets/rooms/v4/props/*` — transparent generated sprites for new independent objects.

## Task 1: Domain contracts and backward-compatible defaults

**Files:**
- Create: `packages/domain/src/cozy-world.ts`
- Modify: `packages/domain/src/world.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/__tests__/cozy-world.test.ts`

**Interfaces:**
- Produces `RoomVibe`, `WegoPose`, `PartnerPulse`, `MemoryMoment`, `DailyQuest`, `CozyWorldState`, `defaultCozyWorldState`, `normalizeCozyWorldState`, `dailyQuestForDate`, and `memoryCopyFor`.
- `WorldSnapshot` gains `cozy: CozyWorldState` with a safe normalizer for stored snapshots created before this feature.

- [ ] **Step 1: Write the failing domain tests**

```ts
it("normalizes an older snapshot into a quiet room with a daily quest", () => {
  const cozy = normalizeCozyWorldState(undefined, "2026-08-28");
  expect(cozy.vibe).toBe("slow-morning");
  expect(cozy.dailyQuest.id).toBe("quest-2026-08-28-ritual");
  expect(cozy.memoryWall).toEqual([]);
});

it("creates warm copy for a completed pair game", () => {
  expect(memoryCopyFor("pair-game", "night-cozy").title).toContain("Вайб");
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `pnpm --filter @wego/domain test -- cozy-world.test.ts`

Expected: FAIL because `cozy-world.ts` exports do not exist.

- [ ] **Step 3: Implement minimal contracts and normalizers**

```ts
export const roomVibes = ["slow-morning", "rainy-date", "study-buddy", "night-cozy", "tiny-party"] as const;
export type RoomVibe = (typeof roomVibes)[number];

export interface CozyWorldState {
  vibe: RoomVibe;
  pose: WegoPose;
  memoryWall: string[];
  pulses: PartnerPulse[];
  game: GameSession | null;
  dailyQuest: DailyQuest;
}
```

`normalizeCozyWorldState` must reject unknown strings, remove duplicate wall ids, cap wall ids at five, and create the current daily quest when missing.

- [ ] **Step 4: Run tests and typecheck**

Run: `pnpm --filter @wego/domain test -- cozy-world.test.ts && pnpm --filter @wego/domain typecheck`

Expected: PASS.

## Task 2: Reducer transitions for vibe, ritual, object, pulse, game, and quest

**Files:**
- Modify: `packages/domain/src/world.ts`
- Modify: `packages/domain/src/world-reducer.ts`
- Test: `packages/domain/src/__tests__/cozy-world.test.ts`

**Interfaces:**
- Consumes `CozyWorldState` from Task 1.
- Produces new `WegoActionType` values: `set_vibe`, `ritual`, `pulse`, `game_answer`, `quest_claim`; object-specific `RoomInteraction` values for lights, speaker, candle, note board, memory wall, console, mirror, gift box, and calendar.
- `reduceWorld(snapshot, action)` emits a message and idempotent reward when appropriate.

- [ ] **Step 1: Add failing reducer tests**

```ts
it("changes room vibe and makes Wego dance in tiny party", () => {
  const result = reduceWorld(createInitialWorld(), action("set_vibe", { vibe: "tiny-party" }));
  expect(result.snapshot.cozy.vibe).toBe("tiny-party");
  expect(result.snapshot.cozy.pose).toBe("party");
});

it("pins a ritual memory once and does not duplicate its reward", () => {
  const result = reduceWorld(createInitialWorld(), action("ritual", { ritual: "tea" }));
  expect(result.snapshot.memories[0]?.kind).toBe("care");
  expect(reduceWorld(result.snapshot, action("ritual", { ritual: "tea", id: result.snapshot.actionKeys.at(-1)! })).reward).toBeNull();
});

it("records a partner answer and completes choose-vibe", () => {
  const waiting = reduceWorld(createInitialWorld(), action("game_answer", { gameAnswer: "night-cozy" })).snapshot;
  const done = reduceWorld({ ...waiting, cozy: { ...waiting.cozy, game: { ...waiting.cozy.game!, partnerAnswer: "night-cozy" } } }, action("game_answer", { gameAnswer: "night-cozy" }));
  expect(done.snapshot.cozy.game?.status).toBe("completed");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @wego/domain test -- cozy-world.test.ts`

Expected: FAIL because the new action and state fields are not defined.

- [ ] **Step 3: Implement pure transitions**

Add optional `vibe`, `ritual`, `pulseKind`, and `gameAnswer` fields to `WegoAction` and `WegoActionSchema`. Use the existing `actionKeys` idempotency guard before every transition. Rituals `tea`, `blanket`, `dance`, `pet`, `feed`, and `photo` set a short pose, adjust at most two needs, and create one `MemoryEntry`. `quest_claim` grants reward only if `dailyQuest.status === "ready"` and then sets it to `claimed`.

- [ ] **Step 4: Run targeted and existing reducer tests**

Run: `pnpm --filter @wego/domain test -- cozy-world.test.ts living-world.test.ts room-interactions.test.ts`

Expected: PASS.

## Task 3: Store commands, persistence, and optimistic sync

**Files:**
- Modify: `apps/web/src/store/use-app-store.ts`
- Test: `apps/web/src/store/use-app-store.test.ts`

**Interfaces:**
- Consumes reducer actions from Task 2.
- Produces `setRoomVibe(vibe)`, `performRitual(ritual)`, `sendPartnerPulse(kind)`, `answerChooseVibe(answer)`, `claimDailyQuest()`, and `pinMemory(memoryId)`.
- `syncWorldAction` accepts all extended world action fields and preserves a successful local state when API sync fails.

- [ ] **Step 1: Write failing store tests**

```ts
it("keeps a chosen vibe after local persistence", () => {
  useAppStore.getState().setRoomVibe("rainy-date");
  expect(useAppStore.getState().world.cozy.vibe).toBe("rainy-date");
});

it("claims a ready daily quest once", () => {
  useAppStore.setState({ world: readyQuestWorld() });
  expect(useAppStore.getState().claimDailyQuest()).toBe(true);
  expect(useAppStore.getState().claimDailyQuest()).toBe(false);
});
```

- [ ] **Step 2: Run the store tests to verify failure**

Run: `pnpm --filter @wego/web test -- use-app-store.test.ts`

Expected: FAIL because the store commands are missing.

- [ ] **Step 3: Implement commands through one reducer helper**

Create a private `commitWorldAction(action)` helper in the store. It runs `reduceWorld`, applies a guarded Spark transaction from `result.reward`, commits, calls `syncWorldAction`, and returns `{ message, reward }`. Command methods only create typed actions and delegate to this helper.

- [ ] **Step 4: Run store tests**

Run: `pnpm --filter @wego/web test -- use-app-store.test.ts`

Expected: PASS.

## Task 4: Scene manifest, independent sprites, and accessible hotspots

**Files:**
- Create: `apps/web/src/features/world/cozy-world-manifest.ts`
- Create: `apps/web/src/features/world/SceneHotspot.tsx`
- Create: `apps/web/src/features/world/SceneHotspot.test.tsx`
- Modify: `apps/web/src/features/world/room-sprite-manifest.ts`
- Create: `apps/web/public/assets/rooms/v4/props/fairy-lights.png`
- Create: `apps/web/public/assets/rooms/v4/props/speaker-vinyl.png`
- Create: `apps/web/public/assets/rooms/v4/props/memory-wall.png`
- Create: `apps/web/public/assets/rooms/v4/props/note-board.png`
- Create: `apps/web/public/assets/rooms/v4/props/console-cozy.png`
- Create: `apps/web/public/assets/rooms/v4/props/candle-glow.png`
- Create: `apps/web/public/assets/rooms/v4/props/mirror-cozy.png`
- Create: `apps/web/public/assets/rooms/v4/props/gift-box.png`

**Interfaces:**
- Produces `cozyObjectSprites` with ids, labels, positions, object action and optional required item id.
- Produces `<SceneHotspot label onClick active locked>` with a native button and at least 44px hit area.

- [ ] **Step 1: Write the failing component and manifest tests**

```tsx
it("announces the object label and invokes its action", async () => {
  const user = userEvent.setup();
  const onClick = vi.fn();
  render(<SceneHotspot label="Включить гирлянду" onClick={onClick} active />);
  await user.click(screen.getByRole("button", { name: "Включить гирлянду" }));
  expect(onClick).toHaveBeenCalledOnce();
});

it("provides eight independently positioned cozy objects", () => {
  expect(cozyObjectSprites).toHaveLength(8);
  expect(new Set(cozyObjectSprites.map((item) => item.id)).size).toBe(8);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @wego/web test -- SceneHotspot.test.tsx room-sprite-manifest.test.ts`

Expected: FAIL because the component and manifest do not exist.

- [ ] **Step 3: Generate and inspect new transparent sprites**

Use the built-in image generation tool once per sprite. Prompt each as a transparent PNG game prop in the existing hand-painted warm paper room style; no text, no full background, centered object, soft coral/mint/yellow/lilac palette, and no character. Inspect each output and copy the selected version to the listed workspace path without overwriting existing v3 assets.

- [ ] **Step 4: Implement manifest and SceneHotspot**

Use static asset paths and percentage based `{ left, top, width }` placement. Locked hotspots render `aria-disabled="true"` and do not call their handler. Add testable `data-object-id` only to the scene wrapper, not as the accessible label.

- [ ] **Step 5: Run tests**

Run: `pnpm --filter @wego/web test -- SceneHotspot.test.tsx room-sprite-manifest.test.ts`

Expected: PASS.

## Task 5: Vibe picker, daily quest, and ritual sheets

**Files:**
- Create: `apps/web/src/features/world/VibePickerSheet.tsx`
- Create: `apps/web/src/features/world/RitualSheet.tsx`
- Create: `apps/web/src/features/world/DailyQuestCard.tsx`
- Create: `apps/web/src/features/world/VibePickerSheet.test.tsx`
- Modify: `apps/web/src/store/use-ui-store.ts`
- Modify: `apps/web/src/app/App.tsx`
- Modify: `apps/web/src/features/world/GameHud.tsx`

**Interfaces:**
- `VibePickerSheet` calls `setRoomVibe(vibe)`.
- `RitualSheet` calls `performRitual(ritual)` and closes after a successful local transition.
- `DailyQuestCard` calls `claimDailyQuest()` and exposes `data-status` for ready, claimed, and pending.

- [ ] **Step 1: Write failing sheet tests**

```tsx
it("selects the rainy date vibe", async () => {
  render(<VibePickerSheet />);
  await userEvent.setup().click(screen.getByRole("button", { name: /Дождливое свидание/i }));
  expect(useAppStore.getState().world.cozy.vibe).toBe("rainy-date");
});

it("does not claim a quest twice", async () => {
  render(<DailyQuestCard />);
  await userEvent.setup().click(screen.getByRole("button", { name: /Забрать/i }));
  expect(screen.getByText(/Уже в твоей коллекции/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm --filter @wego/web test -- VibePickerSheet.test.tsx`

Expected: FAIL because the sheets and UI sheet ids do not exist.

- [ ] **Step 3: Implement focused bottom sheets**

Extend `Sheet` with `vibes` and `rituals`, mount both sheets in App, add HUD buttons with readable labels, and keep all selections in `world.cozy` rather than component-local state.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @wego/web test -- VibePickerSheet.test.tsx use-app-store.test.ts`

Expected: PASS.

## Task 6: Memory wall and Story bridge

**Files:**
- Create: `apps/web/src/features/world/MemoryWall.tsx`
- Create: `apps/web/src/features/world/MemoryWall.test.tsx`
- Modify: `apps/web/src/features/story/StoryPage.tsx`
- Modify: `apps/web/src/features/share/ShareCardDialog.tsx`

**Interfaces:**
- `MemoryWall` consumes `world.memories` and `world.cozy.memoryWall`, calls `pinMemory(id)`, and offers `openShare(id)`.
- `StoryPage` uses the same card copy for new `ritual` and `pair-game` memories.

- [ ] **Step 1: Write failing memory wall tests**

```tsx
it("pins the newest moment and offers sharing", async () => {
  render(<MemoryWall compact={false} />);
  await userEvent.setup().click(screen.getByRole("button", { name: /Закрепить.*Вечерний чай/i }));
  expect(useAppStore.getState().world.cozy.memoryWall).toContain("memory-tea");
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/web test -- MemoryWall.test.tsx`

Expected: FAIL because `MemoryWall` is missing.

- [ ] **Step 3: Implement shared memory presentation**

Render at most five polaroid-sized cards in compact room mode and all moments in sheet/page mode. A pinned item is visually distinct, but its pin button remains usable to unpin. Use existing `openShare` instead of a new share implementation.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @wego/web test -- MemoryWall.test.tsx`

Expected: PASS.

## Task 7: Replace the local prompt with asynchronous “Выбери вайб”

**Files:**
- Modify: `apps/web/src/features/minigames/PairGameSheet.tsx`
- Create: `apps/web/src/features/minigames/PairGameSheet.test.tsx`
- Modify: `apps/web/src/store/use-app-store.ts`

**Interfaces:**
- `answerChooseVibe(answer)` starts/updates `world.cozy.game`.
- The game state exposes `status: "waiting" | "completed"`, `myAnswer`, `partnerAnswer`, and `result`.

- [ ] **Step 1: Write failing interaction test**

```tsx
it("waits for a partner after the first vibe choice", async () => {
  render(<PairGameSheet />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Ночная ламповая" }));
  expect(screen.getByText(/Ждём выбор партнёра/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/web test -- PairGameSheet.test.tsx`

Expected: FAIL because the sheet still has a local three-question loop.

- [ ] **Step 3: Implement a one-screen async game**

Offer the five `RoomVibe` labels. The first answer creates a waiting game and memory draft; a partner answer completes it and adds a pair-game memory. For local preview, show a clearly labelled “ответ партнёра для preview” action only in DEV; it must use the same store command as a real response.

- [ ] **Step 4: Run tests**

Run: `pnpm --filter @wego/web test -- PairGameSheet.test.tsx cozy-world.test.ts`

Expected: PASS.

## Task 8: Compose the living scene, object layers, Wego states, and toast

**Files:**
- Create: `apps/web/src/features/world/CozyToast.tsx`
- Create: `apps/web/src/features/world/CozyToast.test.tsx`
- Modify: `apps/web/src/features/world/LivingRoomScene.tsx`
- Modify: `apps/web/src/features/world/asset-manifest.ts`
- Modify: `apps/web/src/features/world/room-sprite-manifest.ts`

**Interfaces:**
- `LivingRoomScene` renders `cozyObjectSprites`, `SceneHotspot`, `MemoryWall compact`, vibe data class, and the Wego pose from `world.cozy`.
- `CozyToast` renders the latest action result, optional reward and optional CTA without trapping focus.

- [ ] **Step 1: Write failing scene/toast tests**

```tsx
it("shows a readable toast after a ritual", () => {
  render(<CozyToast feedback={{ message: "Чай готов", reward: 4 }} onDismiss={vi.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent("Чай готов");
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/web test -- CozyToast.test.tsx`

Expected: FAIL because `CozyToast` is missing.

- [ ] **Step 3: Compose the scene**

Map new object ids to reducer interactions or a sheet: lights toggle, speaker selects vibe, memory wall opens memory, note board sends a pulse, console opens game, candle toggles night ambience, mirror opens wardrobe, gift box claims quest, calendar opens plans. The room must retain existing lamp/window/table/plant actions.

- [ ] **Step 4: Run component tests**

Run: `pnpm --filter @wego/web test -- CozyToast.test.tsx SceneHotspot.test.tsx MemoryWall.test.tsx`

Expected: PASS.

## Task 9: Cosmetics, room layers, and shop ownership

**Files:**
- Modify: `packages/domain/src/items.ts`
- Modify: `packages/domain/src/items.test.ts`
- Modify: `apps/web/src/features/shop/ShopSheet.tsx`
- Modify: `apps/web/src/features/customization/WardrobeSheet.tsx`
- Modify: `apps/web/src/features/world/LivingRoomScene.tsx`

**Interfaces:**
- Adds cosmetic entries for fairy lights, vinyl speaker, memory wall frame, note-board stickers, candle, mirror, and gift-box skin.
- All entries use existing `RoomSlot` values or collection-only behavior; no new entitlement model.

- [ ] **Step 1: Write failing catalog tests**

```ts
it("offers a cosmetic fairy-lights room item that can be equipped in the wall slot", () => {
  expect(canEquipItem("fairy-lights-neon", { type: "room", slot: "wall" })).toBe(true);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/domain test -- items.test.ts`

Expected: FAIL because the cosmetic id does not exist.

- [ ] **Step 3: Add catalog entries and renderer branches**

Give every premium cosmetic both a Stars price and copy that explicitly says it is visual only. `LivingRoomScene` must use equipped state to render the matching sprite or effect and leave the base interaction available.

- [ ] **Step 4: Run shop and domain tests**

Run: `pnpm --filter @wego/domain test -- items.test.ts && pnpm --filter @wego/web test -- ShopSheet.test.tsx WardrobeSheet.test.tsx`

Expected: PASS.

## Task 10: API validation and persistence of extended actions

**Files:**
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/server.test.ts`
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/migrations/0004_cozy_world_state.sql`
- Modify: `packages/db/src/schema.test.ts`

**Interfaces:**
- Existing `POST /v1/world/actions` accepts extended `WegoActionSchema` inputs and returns normalized `WorldSnapshot`.
- Existing memory snapshot JSON stores the new `cozy` field; migration documents durable tables for future persistent adapters without breaking current memory adapter.

- [ ] **Step 1: Write failing API test**

```ts
it("persists a validated room vibe action", async () => {
  const response = await authenticatedPost(app, "/v1/world/actions", { id: "vibe-1", type: "set_vibe", vibe: "night-cozy", at: "2026-08-28T20:00:00.000Z" });
  expect(response.json().world.cozy.vibe).toBe("night-cozy");
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/api test -- server.test.ts`

Expected: FAIL because `set_vibe` is rejected by Zod.

- [ ] **Step 3: Implement API compatibility**

Use existing authenticated actor replacement (`actorId: user.id`), then persist `normalizeWorld(result.snapshot)`. The migration must add only `world_cozy_state` JSON storage/documentation required by the existing schema convention and keep it reversible.

- [ ] **Step 4: Run API and schema tests**

Run: `pnpm --filter @wego/api test -- server.test.ts && pnpm --filter @wego/db test -- schema.test.ts`

Expected: PASS.

## Task 11: Motion, reduced motion, full verification, and docs

**Files:**
- Modify: `apps/web/src/styles/animations.css`
- Modify: `apps/web/src/styles/globals.css`
- Modify: `README.md`
- Modify: `docs/operations/telegram-stars.md`

**Interfaces:**
- CSS classes cover five vibe layers, Wego poses, eight prop responses, polaroid wall, toast, and an explicit `@media (prefers-reduced-motion: reduce)` block.
- README documents local preview of the partner game and the new room entry points.

- [ ] **Step 1: Write a failing smoke test for reduced-motion-safe class output**

```tsx
it("marks a tiny party scene with its selected vibe", () => {
  render(<LivingRoomScene {...props} />);
  expect(screen.getByLabelText("Живая комната Wego").querySelector("[data-vibe='tiny-party']")).not.toBeNull();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `pnpm --filter @wego/web test -- LivingRoomScene.test.tsx`

Expected: FAIL because the scene does not expose the vibe state.

- [ ] **Step 3: Add CSS and docs**

Use transform/opacity animations only. Disable infinite animations under reduced motion and preserve a visible static state. Describe Telegram Stars as cosmetic-only and document the verified webhook ownership flow.

- [ ] **Step 4: Run the complete verification suite**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all tests, typechecks, and production build pass.

## Self-review

- Spec coverage: Tasks 1–3 cover state, persistence and rewards; 4–5 cover room, sprites, rituals, vibe and quest; 6–8 cover memory, pair game, Wego and object reactions; 9 covers cosmetics and ownership; 10 covers API; 11 covers accessibility, motion, docs and regression verification.
- Intentional first-release boundary: Telegram Stars payment and webhook mechanics already exist and are retained; this plan extends only catalog/ownership presentation, not a second payment system.
- Placeholder scan: no TBD/TODO or deferred implementation steps are used inside tasks.
- Type consistency: all UI commands originate in Task 3, all state types originate in Task 1, and all action variants originate in Task 2 before API/UI consume them.

