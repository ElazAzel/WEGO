# WEGO Living World, Economy and Telegram Stars

**Date:** 2026-08-27  
**Status:** Approved in chat; pending written-spec review  
**Scope:** React 19 upgrade, interactive living room, Wego avatar/room sprite system, soft-currency economy, cosmetic catalog, Telegram Stars payments, and game design system.

## 1. Product intent

WEGO must become a shared place for two people, not a mood form that is opened and closed. The primary loop is:

```text
open the room → interact with Wego or an object → make a shared choice
→ receive a visible world reaction → save the moment → return later
```

The room is the product surface. Check-ins, plans, mini-games, purchases and memories must feed the room and the Wego character. The product keeps the existing warm cream/plum/coral/lilac/mint/yellow visual language and avoids a separate dark or neon game UI.

The first release is a gentle virtual-pet experience. It may borrow the clarity of classic virtual pets, but it must not use punitive hunger/death loops, pay-to-win mechanics, gambling, or pressure-based notifications.

## 2. Non-goals

- No full social feed or public community layer.
- No real-time voice/video or multiplayer physics.
- No paid access to the base check-in, Reveal, Story, or core memory features.
- No conversion of Telegram Stars into the internal soft currency.
- No client-authoritative balances, inventory, purchases, or unlocks.
- No final character animation built from the current opaque PNG as-is.

## 3. Technical direction

### 3.1 React 19 migration

Upgrade the workspace to React 19 and the matching `react-dom` and type packages. Keep the public component API stable where possible. Verify compatibility of React Router, Zustand, Testing Library, Vite and Playwright before moving feature work onto the new renderer.

The web package will use:

- React 19 and `react-dom` 19;
- `pixi.js` 8 for the interactive scene;
- `@pixi/react` 8 only if its React 19 integration fits the existing app; otherwise use a small imperative Pixi canvas adapter behind a React component;
- `motion` for DOM/sheet/gesture animation;
- existing Zustand state for UI and optimistic state;
- existing domain package for pure rules and validation.

Pixi is responsible for scene rendering and hit areas, not routing, forms or payment dialogs. React remains responsible for application UI and accessibility. The first implementation should not introduce Phaser into the main room. Phaser is reserved for a later isolated mini-game whose needs exceed simple scene interaction.

### 3.2 Layered scene

The current Home composition of one room image plus one character image is replaced by:

```text
LivingRoomScene
 ├── RoomBackground
 ├── RoomAtmosphere
 ├── RoomItems
 ├── WegoCharacter
 ├── OutfitLayer
 ├── InteractionZones
 ├── ParticleEffects
 └── SceneHud
```

The scene must scale to the available mobile viewport, respect Telegram safe-area insets, and expose keyboard/focus fallbacks for important interactions. A reduced-motion mode must disable continuous animation and replace it with still states or short transitions.

## 4. Wego character system

### 4.1 Character states

The domain model supports these states:

- `idle`;
- `blink`;
- `happy`;
- `sleepy`;
- `curious`;
- `shy`;
- `excited`;
- `pet`;
- `receiving-gift`;
- `playing`;
- `partner-joined`;
- `outfit-changed`.

State changes are deterministic from user action, shared events, local time and world state. Wego never loses progress because a user missed a day.

### 4.2 Needs and reactions

Wego has soft, non-punitive values:

```ts
type WegoNeeds = {
  comfort: number;
  joy: number;
  curiosity: number;
};
```

These values influence idle choice, speech bubble, particles and room ambience. They do not lock the app, remove items or create a negative debt.

### 4.3 Asset contract

The final character must be delivered as transparent, composable assets or a Rive file. The current opaque character PNG remains only as a temporary fallback and is not the final scene asset.

Required first asset pack:

- transparent Wego base body for style A;
- transparent Wego base body for style B;
- idle, happy, sleepy and pet poses;
- five outfit layers;
- seven small reaction/effect layers;
- lamp on/off;
- plant at three growth stages;
- gift, books, mug, suitcase, picture frame and game console;
- three room decoration variants.

Generated assets must be visually consistent with the existing room illustrations, preserve the warm hand-illustrated aesthetic, avoid text/watermarks, and be stored in the workspace under versioned filenames. Existing assets must not be overwritten without explicit selection.

## 5. World model

```ts
type WorldState = {
  wego: {
    state: WegoState;
    outfitId: string;
    needs: WegoNeeds;
    affection: number;
  };
  room: {
    items: string[];
    lampOn: boolean;
    plantStage: number;
    atmosphere: "morning" | "day" | "evening" | "night";
  };
  activePlan: string | null;
  unlockedItems: string[];
  memories: WorldMemory[];
};
```

World actions are explicit commands, not arbitrary client patches:

- `pet_wego`;
- `give_gift`;
- `change_outfit`;
- `toggle_lamp`;
- `water_plant`;
- `place_item`;
- `start_plan`;
- `complete_plan`;
- `play_game`;
- `save_memory`.

Each command is validated by the server, recorded with an idempotency key, applied to the world reducer, and emits a versioned `world_updated` event.

## 6. Economy

### 6.1 Internal currency: Искры

Искры are a non-transferable soft currency. They are earned by participation and spent on cosmetic and interaction content.

Initial reward values are configuration, not hard-coded in components:

| Action | Reward |
|---|---:|
| First room interaction of the day | 5 |
| Both users complete a daily check-in | 15 |
| Complete a shared plan | 25 |
| Finish a mini-game | 10–20 |
| Save a memory | 10 |
| Care interaction | 2–5 |
| Seven-day shared participation milestone | 50 |

The first release uses a daily earn cap to prevent grinding. The cap is configurable on the server and does not prevent users from performing an action; it only prevents additional currency rewards after the cap.

### 6.2 Spending

Искры can buy:

- base outfits;
- room furniture;
- room effects;
- Wego emotions;
- temporary reaction effects;
- free mini-game packs;
- memory card styles.

Essential relationship functionality remains free. Paid content is cosmetic or additive.

### 6.3 Server ledger

```text
wallets
  user_id
  sparks_balance

wallet_ledger
  id
  user_id
  space_id
  amount
  reason
  source_id
  idempotency_key
  created_at
```

Every balance mutation happens in a database transaction. The unique `idempotency_key` prevents duplicate rewards from retries, double taps or reconnects.

### 6.4 Ownership

- Room furniture, room themes and shared effects belong to `space_id`.
- Personal outfits and personal reaction packs belong to `user_id`.
- A shared purchase is visible to both members immediately.
- Purchases are represented as entitlements and are never inferred from a client balance.

## 7. Paid content and Telegram Stars

### 7.1 Catalog

```text
catalog_items
  sku
  type
  title
  description
  price_sparks
  price_stars
  asset_manifest
  owner_scope: user | space
  active
```

The catalog is the source of truth for prices and grants. Components receive catalog data from the API and never embed prices.

### 7.2 Payment flow

```text
Mini App purchase tap
  → API creates an invoice payload
  → Telegram invoice opens in Mini App
  → pre_checkout_query is validated
  → successful_payment arrives at bot webhook
  → purchase becomes paid
  → entitlement is granted once
  → client refreshes wallet/inventory/world
```

For digital goods inside Telegram, use Telegram Stars with currency `XTR` and an empty provider token. The API must validate the product SKU, expected price, user and space before confirming pre-checkout. The payment charge ID is stored for refunds.

Required payment endpoints:

- `POST /v1/billing/invoices`;
- `POST /v1/billing/verify` only for internal reconciliation, never as a client authority;
- `GET /v1/billing/catalog`;
- `GET /v1/billing/purchases`;
- bot webhook handlers for `pre_checkout_query` and `successful_payment`;
- `/paysupport` bot command;
- refund service using the Telegram charge ID.

The bot balance is the author/developer revenue account. Withdrawal or reward conversion is handled through Telegram's developer flow; the product must not promise a direct bank payout from the Mini App.

### 7.3 Payment safety

- No random paid loot boxes.
- No paid advantage in games.
- No automatic purchase after a tap.
- The purchase dialog shows item, scope, price and refund/support path.
- Successful payment is the only event that grants the entitlement.
- `pending`, `cancelled` and `failed` invoice statuses do not grant content.
- Payment payloads contain an opaque order ID, not notes or raw Telegram data.

## 8. Design system

The game layer extends the existing WEGO UI kit instead of creating a second design language.

### 8.1 Tokens

Keep existing tokens and add only semantic game tokens:

- `--game-spark`: warm yellow accent;
- `--game-star`: lilac/gold accent for paid content;
- `--game-scene-shadow`: soft plum scene shadow;
- `--game-overlay`: translucent cream overlay;
- `--game-success`: mint;
- `--game-attention`: yellow.

Use the existing 4/8 spacing grid, serif titles, sans body text, 20–36px rounded surfaces, tactile button shadows and safe-area padding.

### 8.2 Components

```text
GameShell
GameHud
CurrencyPill
SparkBalance
StarBalance
LivingRoomScene
SceneHotspot
WegoCharacter
ReactionBubble
RewardToast
DailyQuest
SharedPlanCard
MiniGameCard
PartnerActionCard
WardrobeSheet
OutfitCard
RoomItemPicker
ShopSheet
ShopItemCard
PurchaseDialog
PaymentStatus
InventoryGrid
MemoryCard
MemoryDetail
UnlockAnimation
```

Every interactive component needs loading, disabled, error and reduced-motion states. Payment components must also show cancelled, failed and pending states.

## 9. API and realtime contracts

World endpoints:

- `GET /v1/spaces/:spaceId/world`;
- `POST /v1/spaces/:spaceId/world/actions`;
- `GET /v1/spaces/:spaceId/wardrobe`;
- `POST /v1/spaces/:spaceId/wardrobe/equip`;
- `GET /v1/spaces/:spaceId/room-items`;
- `POST /v1/spaces/:spaceId/room-items/place`;
- `GET /v1/spaces/:spaceId/memories`;
- `POST /v1/spaces/:spaceId/memories`;
- `GET /v1/spaces/:spaceId/plans`;
- `POST /v1/spaces/:spaceId/plans`;
- `POST /v1/spaces/:spaceId/plans/:planId/complete`.

Realtime event types:

- `world_updated`;
- `partner_action`;
- `plan_created`;
- `plan_completed`;
- `item_unlocked`;
- `memory_created`;
- `purchase_granted`.

The existing SSE channel remains the first realtime transport. The event contains `spaceId`, `type`, `version` and safe metadata only; it never carries private notes or raw payment data.

## 10. Implementation sequence

### Phase A: React 19 and scene foundation

1. Upgrade React, React DOM, types and test adapters.
2. Run typecheck, lint, unit tests and Playwright.
3. Add Pixi scene adapter and lazy-load the scene.
4. Split room background and Wego layer.
5. Add idle, breathing, blink and reduced-motion states.
6. Add scene hit zones and interaction feedback.

### Phase B: Wego and room interactions

1. Add world domain types and reducer.
2. Add outfit and room-item manifests.
3. Add wardrobe sheet and inventory.
4. Add care actions and reward toasts.
5. Add lamp, plant, gift and room-object interactions.
6. Persist local state through the existing local-first adapter.

### Phase C: Shared actions and memory

1. Add server world tables and repositories.
2. Add world endpoints and idempotency.
3. Connect world actions to SSE.
4. Add shared plans.
5. Add the first two asynchronous mini-games.
6. Save important results as Story/memory entries.

### Phase D: Economy and catalog

1. Add wallet and append-only ledger.
2. Add reward rules and daily cap.
3. Add catalog and entitlements.
4. Add shop and inventory UI.
5. Add economy tests, duplicate-request tests and authorization tests.

### Phase E: Stars payments

1. Add bot webhook configuration.
2. Create XTR invoice links from the API.
3. Open invoices through Telegram WebApp.
4. Handle pre-checkout within Telegram's time limit.
5. Handle successful payments idempotently.
6. Add support and refund flows.
7. Test using Telegram's dedicated test environment before production credentials.

### Phase F: Visual asset production

1. Generate transparent Wego sprite concepts consistent with the current room.
2. Select and validate the first sprite pack.
3. Add outfits, reactions and furniture assets.
4. Replace temporary PNG fallback.
5. Measure mobile performance and asset loading.

## 11. Acceptance criteria

- React 19 build is green.
- Wego is rendered independently from the room background.
- At least five room objects are interactive.
- Wego has continuous idle behavior and tap reactions.
- Reduced-motion mode works.
- At least one outfit can be equipped and persisted.
- A shared action changes the world for both participants.
- A completed action creates a memory entry.
- Искры are awarded and spent only through server-authoritative mutations.
- Repeated requests cannot duplicate rewards or entitlements.
- Paid digital cosmetics open a Telegram Stars invoice using `XTR`.
- Unpaid, cancelled or failed invoices do not unlock content.
- Successful payment grants exactly one entitlement.
- Refund support can locate the original Telegram charge.
- Core check-in, Reveal and Story remain available without payment.
- Mobile and Telegram safe areas are respected.
- Unit, API and two-user Playwright flows pass.

## 12. References

- Telegram Mini Apps: https://core.telegram.org/bots/webapps
- Telegram digital goods and Stars: https://core.telegram.org/bots/payments-stars
- Telegram Bot API: https://core.telegram.org/bots/api
- PixiJS React: https://react.pixijs.io/getting-started/
- Motion for React: https://motion.dev/docs/react
- Rive state machines: https://rive.app/docs/editor/state-machine/state-machine
