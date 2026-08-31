# WEGO Interactive Room & Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать комнату сохраняемым игровым пространством, где клики меняют свет, шторы, чай, растения и реакцию Вего, а купленные предметы попадают в инвентарь и могут устанавливаться или надеваться.

**Architecture:** Доменный `WorldSnapshot` остаётся единственным источником истины для состояния окружения, владения и экипировки. Zustand применяет доменные reducer-операции и сохраняет snapshot, layered DOM-сцена отображает его через независимые спрайты, а API/Telegram используют те же типизированные действия и проверки.

**Tech Stack:** React 19, TypeScript, Zustand, Zod, Vitest, Testing Library, Vite, Telegram Stars invoice/webhook flow, текущая layered DOM scene и CSS animations.

**Spec:** `docs/superpowers/specs/2026-08-27-living-room-interactions-design.md`

## Global Constraints

- Сохранять текущий мягкий пастельный визуальный стиль WEGO и не заменять рабочую layered DOM-сцену полным Pixi-рефакторингом.
- React 19 остаётся минимальной поддерживаемой версией.
- Старые snapshot-данные без `environment` и equipment должны открываться через нормализацию без потери `unlockedItemIds` и `outfitId`.
- Переключаемые действия не должны давать бесконечный фарм Искр; применяются существующие daily caps и reward guards.
- Покупка добавляет предмет во владение, но не экипирует его автоматически.
- Stars выдаются только после подтверждённого webhook; подарок попадает в инвентарь адресата, но не надевается автоматически.
- Локальный preview должен работать без сети и не имитировать успешный реальный Stars-платёж.
- Каждый production-кодовый шаг начинается с теста, который сначала запускается и падает по ожидаемой причине.

## File Map

- `packages/domain/src/world.ts` — типы `RoomObjectId`, `WorldAction`, `WorldSnapshot`, defaults и нормализация snapshot.
- `packages/domain/src/room-state.ts` — типы environment/equipment, допустимые room interactions и чистые функции переходов состояния.
- `packages/domain/src/items.ts` — единый каталог предметов, слоты и правила совместимости.
- `packages/domain/src/world-reducer.ts` — применение `room_interact`, equip/unequip действий и сообщений.
- `apps/web/src/store/use-app-store.ts` — публичные действия UI, persistence и соединение reducer/economy.
- `apps/web/src/features/world/room-sprite-manifest.ts` — базовые и state-dependent слои комнаты.
- `apps/web/src/features/world/LivingRoomScene.tsx` — renderer состояния environment/equipment и accessible interaction buttons.
- `apps/web/src/features/shop/ShopSheet.tsx` — каталог, фильтры, покупка и установка интерьерных предметов.
- `apps/web/src/features/customization/WardrobeSheet.tsx` — образы, аксессуары, эмоции и надевание/снятие.
- `apps/api/src/modules/billing/catalog.ts` — серверный каталог с ценами и item metadata.
- `apps/api/src/server.ts`, `apps/api/src/modules/billing/telegram-webhook.ts` — authenticated world sync, purchase ownership и подарки.
- `apps/web/src/styles/globals.css`, `apps/web/src/styles/animations.css` — состояния света, штор, чая, растений и micro-interactions.

### Task 1: Добавить типы состояния комнаты и нормализацию старых snapshot

**Files:**
- Create: `packages/domain/src/room-state.ts`
- Modify: `packages/domain/src/world.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/room-state.test.ts`

**Interfaces:**
- Produces `RoomEnvironmentState`, `RoomEnvironmentObjectId`, `RoomInteraction`, `RoomSlot`, `EquippedRoomItems`, `EquippedWegoItems`, `defaultRoomEnvironment()` и `normalizeRoomState(input)`.
- `WorldSnapshot` получает `environment`, `equippedRoomItems`, `equippedWegoItems`; старые поля `unlockedItemIds` и `outfitId` сохраняются.

- [ ] **Step 1: Write the failing tests**

```ts
it("fills environment and equipment for a legacy snapshot", () => {
  const result = normalizeRoomState({ unlockedItemIds: ["everyday", "everyday"], outfitId: "sunny-scarf" });

  expect(result.environment).toEqual({ lamp: "on", curtains: "open", table: "empty", plants: "healthy", window: "quiet" });
  expect(result.equippedRoomItems).toEqual({ sofa: null, rug: null, lamp: null, table: null, shelf: null, plants: null, wall: null });
  expect(result.equippedWegoItems).toEqual({ outfit: "sunny-scarf", accessory: null, emotion: null });
  expect(result.unlockedItemIds).toEqual(["everyday", "sunny-scarf"]);
});

it("rejects unknown environment values and keeps valid equipment slots", () => {
  const result = normalizeRoomState({ environment: { lamp: "broken", curtains: "closed" }, equippedRoomItems: { lamp: "coral-lamp", unknown: "hack" } });

  expect(result.environment.lamp).toBe("on");
  expect(result.environment.curtains).toBe("closed");
  expect(result.equippedRoomItems).toEqual(expect.objectContaining({ lamp: "coral-lamp" }));
  expect(result.equippedRoomItems).not.toHaveProperty("unknown");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/room-state.test.ts`

Expected: FAIL because `room-state.ts` and the normalizer do not exist.

- [ ] **Step 3: Implement the minimum types and normalizer**

Define literal unions, default objects, deduplication of `unlockedItemIds`, whitelist valid room slots, and fallback values for invalid environment/equipment data. Update `createInitialWorld()` to include normalized defaults and add `window`/`table` to `RoomObjectId` and initial `roomObjects`.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/room-state.test.ts`

Expected: 2 tests pass.

### Task 2: Implement deterministic room interaction transitions

**Files:**
- Modify: `packages/domain/src/world.ts`
- Modify: `packages/domain/src/world-reducer.ts`
- Modify: `packages/domain/src/validation.ts` or the existing world schema location
- Test: `packages/domain/src/room-interactions.test.ts`

**Interfaces:**
- `RoomInteraction` accepts `{ objectId: "lamp"; interaction: "toggle" }`, `{ objectId: "window"; interaction: "toggle-curtains" }`, `{ objectId: "table"; interaction: "serve-tea" | "collect-tea" }`, `{ objectId: "plant"; interaction: "water" }`.
- `reduceWorld(snapshot, action)` handles `type: "room_interact"`, updates `environment`, `roomObjects[objectId].lastInteractedAt`, needs, message and idempotency keys.

- [ ] **Step 1: Write failing transition tests**

```ts
it("toggles the lamp without changing it twice for a replayed action", () => {
  const first = reduceWorld(createInitialWorld(), { id: "lamp-1", type: "room_interact", actorId: "u1", objectId: "lamp", interaction: "toggle", at: "2026-08-27T10:00:00.000Z" });
  const replay = reduceWorld(first.snapshot, { id: "lamp-1", type: "room_interact", actorId: "u1", objectId: "lamp", interaction: "toggle", at: "2026-08-27T10:01:00.000Z" });

  expect(first.snapshot.environment.lamp).toBe("off");
  expect(first.snapshot.roomObjects.lamp.lastInteractedAt).toBe("2026-08-27T10:00:00.000Z");
  expect(replay.snapshot.environment.lamp).toBe("off");
  expect(replay.reward).toBeNull();
});

it("serves and collects tea at the table", () => {
  const served = reduceWorld(createInitialWorld(), { id: "tea-1", type: "room_interact", actorId: "u1", objectId: "table", interaction: "serve-tea", at: "2026-08-27T10:00:00.000Z" });
  const collected = reduceWorld(served.snapshot, { id: "tea-2", type: "room_interact", actorId: "u1", objectId: "table", interaction: "collect-tea", at: "2026-08-27T10:02:00.000Z" });

  expect(served.snapshot.environment.table).toBe("tea-ready");
  expect(collected.snapshot.environment.table).toBe("empty");
  expect(collected.message).toContain("чай");
});
```

- [ ] **Step 2: Run the tests to verify RED**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/room-interactions.test.ts`

Expected: FAIL because `room_interact` and environment transitions are not implemented.

- [ ] **Step 3: Implement reducer transitions and validation**

Extend the action union/schema with `room_interact` and `interaction`. For each valid transition update only the relevant environment value, touch timestamp, and small needs adjustment. Return `null` reward for toggles; route any eligible first-care reward through existing reward guards in the store.

- [ ] **Step 4: Run focused and existing domain tests**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/room-state.test.ts packages/domain/src/room-interactions.test.ts packages/domain/src/__tests__/living-world.test.ts`

Expected: all focused and existing domain tests pass.

### Task 3: Create the canonical catalog and equip rules

**Files:**
- Create: `packages/domain/src/items.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `apps/api/src/modules/billing/catalog.ts`
- Test: `packages/domain/src/items.test.ts`

**Interfaces:**
- Consumes `RoomSlot` from `packages/domain/src/room-state.ts` and produces `CatalogItem`, `ItemKind`, `itemCatalog`, `getCatalogItem(itemId)`, `canEquipItem(itemId, target)` and `isCosmeticItem(itemId)`.
- Every item has `id`, `kind`, `slot` or `null`, `assetId`, `title`, `description`, `tone`, `sparkPrice`, `starsPrice` and `behavior`.

- [ ] **Step 1: Write failing catalog/equip tests**

```ts
it("maps room purchases to a compatible room slot", () => {
  expect(canEquipItem("soft-blanket", { type: "room", slot: "sofa" })).toBe(true);
  expect(canEquipItem("soft-blanket", { type: "room", slot: "lamp" })).toBe(false);
});

it("keeps paid cosmetics separate from free outfit defaults", () => {
  const item = getCatalogItem("sunny-scarf");
  expect(item?.kind).toBe("outfit");
  expect(item?.assetId).toBeTruthy();
  expect(item?.starsPrice).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run RED**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/items.test.ts`

Expected: FAIL because the canonical item catalog does not exist.

- [ ] **Step 3: Implement catalog and server mapping**

Move duplicated metadata into the domain catalog while preserving regional price calculation in the API. Add room items for blanket, lamp variants, curtain/window theme and table tea set, plus outfit/accessory/emotion metadata. Keep server prices authoritative.

- [ ] **Step 4: Run GREEN**

Run: `node node_modules/vitest/vitest.mjs run packages/domain/src/items.test.ts apps/api/src/modules/billing/billing.test.ts`

Expected: all catalog and billing tests pass.

### Task 4: Add store actions for interaction, ownership and equipment

**Files:**
- Modify: `apps/web/src/store/use-app-store.ts`
- Test: `apps/web/src/store/use-app-store.test.ts`

**Interfaces:**
- Add `interactRoom(interaction: RoomInteraction): { message: string; reward: number }`.
- Add `equipRoomItem(itemId: string): boolean`, `unequipRoomItem(slot: RoomSlot): boolean`, `equipWegoItem(itemId: string): boolean`, `unequipWegoItem(slot: "accessory" | "emotion"): boolean`.
- `unlockWithSparks(itemId, price)` remains public but validates the canonical catalog and records ownership without equipping.

- [ ] **Step 1: Write failing store behavior tests**

```ts
it("persists a lamp interaction in the store", () => {
  useAppStore.getState().reset();
  const result = useAppStore.getState().interactRoom({ objectId: "lamp", interaction: "toggle" });

  expect(result.message).toContain("свет");
  expect(useAppStore.getState().world.environment.lamp).toBe("off");
});

it("adds an owned item before it can be equipped", () => {
  useAppStore.getState().reset();
  const bought = useAppStore.getState().unlockWithSparks("soft-blanket", 1);

  expect(bought).toBe(true);
  expect(useAppStore.getState().world.unlockedItemIds).toContain("soft-blanket");
  expect(useAppStore.getState().equipRoomItem("soft-blanket")).toBe(true);
  expect(useAppStore.getState().world.equippedRoomItems.sofa).toBe("soft-blanket");
});
```

- [ ] **Step 2: Run RED**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/store/use-app-store.test.ts`

Expected: FAIL because the store methods and snapshot fields are missing.

- [ ] **Step 3: Implement store methods and normalized persistence**

Initialize `initial` with `normalizeWorld`, call `reduceWorld` for room interactions, retain economy guardrails, reject unaffordable/unknown/non-owned equip requests, and persist all serializable environment/equipment fields through the existing `persist` function.

- [ ] **Step 4: Run GREEN and regression tests**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/store/use-app-store.test.ts packages/domain/src`

Expected: store and all domain tests pass.

### Task 5: Add visual environment states and interaction sprites

**Files:**
- Create: `apps/web/public/assets/rooms/v3/props/tea-set.png`
- Create: `apps/web/public/assets/rooms/v3/props/curtains-closed.png`
- Modify: `apps/web/src/features/world/room-sprite-manifest.ts`
- Modify: `apps/web/src/features/world/LivingRoomScene.tsx`
- Modify: `apps/web/src/lib/asset.ts`
- Modify: `apps/web/src/styles/globals.css`
- Modify: `apps/web/src/styles/animations.css`
- Test: `apps/web/src/features/world/room-sprite-manifest.test.ts`

**Interfaces:**
- `roomSprites` exposes state-aware definitions for lamp, window, table, plants, sofa, rug and bowl.
- `roomSpriteAsset(id)` returns the stable asset path, and `roomInteractionFor(objectId, environment)` returns the next typed `RoomInteraction` for that object.
- Renderer reads `world.environment`, `world.equippedRoomItems` and calls `interactRoom` with typed actions.
- Labels change with state, for example `"Выключить свет"`, `"Открыть шторы"`, `"Собрать чай"`.

- [ ] **Step 1: Extend the manifest test first**

```ts
it("contains state assets for the window and tea table", () => {
  expect(roomSpriteAsset("curtains-closed")).toContain("curtains-closed.png");
  expect(roomSpriteAsset("tea-set")).toContain("tea-set.png");
  expect(roomInteractionFor("lamp", { lamp: "on", curtains: "open", table: "empty", plants: "healthy", window: "quiet" })).toMatchObject({ objectId: "lamp", interaction: "toggle" });
});
```

- [ ] **Step 2: Run RED**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/features/world/room-sprite-manifest.test.ts`

Expected: FAIL because state assets and environment interaction mapping do not exist.

- [ ] **Step 3: Generate and copy transparent assets**

Use the existing image generation workflow to create two isolated transparent sprites in the same pastel hand-painted style. Inspect alpha and visual quality, then copy them into `apps/web/public/assets/rooms/v3/props/` without replacing existing assets.

- [ ] **Step 4: Implement state-aware layered rendering**

Render the closed-curtain layer only for `curtains: "closed"`, add lamp glow only for `lamp: "on"`, show tea-set only for `table: "tea-ready"`, and add the equipped room asset after the base prop and before Vego. Convert visual buttons to call store room actions instead of generic `decorate` where an environmental transition exists.

- [ ] **Step 5: Add micro-interaction styles and accessibility**

Add state classes, active glow, curtain transition, tea steam and plant-care feedback. Keep `prefers-reduced-motion` behavior. Ensure every stateful sprite has a changing accessible label and every missing asset falls back to the base sprite.

- [ ] **Step 6: Run focused tests and typecheck**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/features/world/room-sprite-manifest.test.ts`; then `node node_modules/typescript/bin/tsc -p apps/web/tsconfig.json --noEmit --pretty false`.

Expected: focused tests pass and TypeScript exits 0.

### Task 6: Connect shop, inventory and wardrobe UI

**Files:**
- Modify: `apps/web/src/features/shop/ShopSheet.tsx`
- Modify: `apps/web/src/features/customization/WardrobeSheet.tsx`
- Modify: `apps/web/src/features/world/GameHud.tsx`
- Modify: `apps/web/src/features/world/asset-manifest.ts`
- Modify: `apps/web/src/styles/globals.css`
- Test: `apps/web/src/features/shop/ShopSheet.test.tsx`
- Test: `apps/web/src/features/customization/WardrobeSheet.test.tsx`

**Interfaces:**
- Shop consumes `itemCatalog` and shows `Buy`, `Owned`, `Install`, `Remove`, `Gift` according to item state.
- Wardrobe consumes the same catalog and calls `equipWegoItem`/`unequipWegoItem`.
- Wego asset resolution accepts `outfitId` and optional accessory/emotion while preserving existing idle/pet fallback assets.

- [ ] **Step 1: Write failing UI tests**

```tsx
it("offers install instead of another purchase for an owned room item", () => {
  useAppStore.getState().reset();
  useAppStore.getState().unlockWithSparks("rainy-window", 1);
  useUiStore.getState().openSheet("shop");
  render(<ShopSheet />);
  expect(screen.getByRole("button", { name: /установить/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /✦ 320/i })).not.toBeInTheDocument();
});

it("shows the equipped outfit as worn", () => {
  useAppStore.getState().reset();
  useAppStore.getState().unlockWithSparks("sunny-scarf", 1);
  useAppStore.getState().equipWegoItem("sunny-scarf");
  useUiStore.getState().openSheet("wardrobe");
  render(<WardrobeSheet />);
  expect(screen.getByText("Надето")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run RED**

Run: `node node_modules/vitest/vitest.mjs run apps/web/src/features/shop/ShopSheet.test.tsx apps/web/src/features/customization/WardrobeSheet.test.tsx`

Expected: FAIL because the sheets do not expose inventory/equipment states.

- [ ] **Step 3: Implement shared catalog-driven UI**

Remove duplicated local item metadata, add category filters and an owned-items view, wire room installation and Wego equipment actions, and keep Stars purchase buttons separate from local Spark ownership.

- [ ] **Step 4: Run GREEN and verify keyboard access**

Run the focused UI tests, then verify each `Install`, `Remove`, `Надеть` and `Снять` control has an accessible name and works by keyboard activation.

### Task 7: Extend API sync and Telegram purchase ownership

**Files:**
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/modules/billing/catalog.ts`
- Modify: `apps/api/src/modules/billing/telegram-webhook.ts`
- Modify: `apps/api/src/modules/billing/telegram-stars.ts`
- Modify: `packages/db/src/schema.ts`
- Create: `packages/db/migrations/0004_world_environment_equipment.sql`
- Test: `apps/api/src/world-sync.test.ts`
- Test: `apps/api/src/modules/billing/billing.test.ts`

**Interfaces:**
- Authenticated world sync accepts normalized environment/equipment snapshots or typed room/equip actions.
- Successful Stars webhook adds the item to the recipient's owned IDs and never changes equipment fields.
- Server rejects unknown item IDs, incompatible slots, duplicate ownership and unauthenticated partner IDs.

- [ ] **Step 1: Write failing API tests**

```ts
it("syncs a lamp toggle and preserves equipment", async () => {
  const app = buildServer();
  const auth = await app.inject({ method: "POST", url: "/v1/auth/telegram", payload: { initData: "" } });
  const token = auth.json<{ token: string }>().token;
  const response = await app.inject({ method: "POST", url: "/v1/world/actions", headers: { authorization: `Bearer ${token}` }, payload: { type: "room_interact", objectId: "lamp", interaction: "toggle" } });

  expect(response.statusCode).toBe(200);
  expect(response.json().world.environment.lamp).toBe("off");
  expect(response.json().world.equippedRoomItems).toBeDefined();
  await app.close();
});

it("credits a Stars gift to ownership without auto-equipping it", async () => {
  const payload = starsPurchasePayload({ purchaseId: "gift-1", userId: "u1", itemId: "soft-blanket", spaceId: "space-1", recipientUserId: "u2" });
  const payment = successfulPaymentFrom({ message: { successful_payment: { invoice_payload: payload, telegram_payment_charge_id: "charge-1" } } });

  expect(payment?.recipientUserId).toBe("u2");
  expect(payment?.itemId).toBe("soft-blanket");
});
```

- [ ] **Step 2: Run RED**

Run: `node node_modules/vitest/vitest.mjs run apps/api/src/world-sync.test.ts apps/api/src/modules/billing/billing.test.ts`

Expected: FAIL because sync routes and equipment-aware webhook behavior are absent.

- [ ] **Step 3: Implement validation, persistence and webhook ownership**

Use the domain normalizer before writes, add the world action route, persist environment/equipment columns or serialized snapshot fields in the next migration, and reuse existing billing idempotency and recipient validation.

- [ ] **Step 4: Run GREEN and API regression tests**

Run: `node node_modules/vitest/vitest.mjs run apps/api/src packages/domain/src`

Expected: all API and domain tests pass.

### Task 8: Verify the full user journey locally and document the feature

**Files:**
- Modify: `docs/operations/telegram-stars.md`
- Modify: `README.md`
- Test: `tests/e2e/core-flow.spec.ts`

- [ ] **Step 1: Run the complete automated suite**

Run: `node node_modules/vitest/vitest.mjs run apps/api/src packages/domain/src packages/ui/src apps/web/src`

Expected: 0 failed test files and 0 failed tests.

- [ ] **Step 2: Run typechecks and production build**

Run: `node node_modules/typescript/bin/tsc -p apps/web/tsconfig.json --noEmit --pretty false`; then from `apps/web`: `node ../../node_modules/vite/bin/vite.js build`.

Expected: both commands exit 0. Existing unresolved optional font warnings may remain, but no new asset or TypeScript errors are allowed.

- [ ] **Step 3: Extend and run the local browser smoke test**

Open `http://127.0.0.1:5173/wego`, verify that lamp, curtains, table, plant and character clicks visibly change the scene, then buy a Spark item, reload, open the collection, install it, remove it, equip an outfit and confirm the state survives reload. Check that all state buttons have accessible names and the browser console has no errors.

- [ ] **Step 4: Update operator documentation**

Document the item lifecycle `catalog → purchase → owned → equipped`, the webhook rule that gifts are not auto-equipped, the snapshot migration defaults, and the local preview limitations for Stars.
