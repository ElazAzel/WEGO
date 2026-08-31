import { create } from "zustand";
import { canEquipItem, getCatalogItem, getSpaceDate } from "@wego/domain";
import { applySparkTransaction, canEarnDaily, canRewardAction, checkinRewardInputs, createInitialEconomy, createInitialWorld, DAILY_SPARK_CAP, markRewardedAction, normalizeEconomy, normalizeWorld, reduceWorld } from "@wego/domain";
import type { HomeVariant, MoodId, StoryEntry, SpaceType, Tone, WantId, EnergyId, WegoStage, WegoStyle, WorldSnapshot, EconomyState, RoomObjectId, SharedPlan, MemoryEntry, RoomInteraction, RoomSlot, WegoActionType, RoomVibe, RitualId, PartnerPulseKind, WorldAction, MoveInItemId } from "@wego/domain";
import { readLocalState, writeLocalState } from "../lib/storage";

export interface AppUser { id: string; name: string; tone: Tone; }
export interface AppSpace { id: string; name: string; type: SpaceType; stage: WegoStage; character: string; daysAlive: number; style: WegoStyle; room: "warm" | "morning"; timezone: string; }
export interface AppToday { date: string; myMood: MoodId | null; myEnergy: EnergyId | null; myWant: WantId | null; myNote: string; myGuess: MoodId | null; partnerMood: MoodId | null; partnerEnergy: EnergyId | null; partnerWant: WantId | null; partnerNote: string | null; revealed: boolean; }
export interface DailyQuestion { id: string; text: string; options: string[]; myAnswer: string | null; partnerAnswered: boolean; partnerAnswer: string | null; }
export interface WhoPrompt { id: string; text: string; left: string; right: string; myVote: string | null; partnerVote: string | null; }
export type WorldActionType = Exclude<WegoActionType, "room_interact">;

interface AppState {
  space: AppSpace | null;
  me: AppUser | null;
  partner: AppUser | null;
  today: AppToday;
  story: StoryEntry[];
  plannedActivities: string[];
  dailyQuestion: DailyQuestion;
  whoPrompts: WhoPrompt[];
  homeVariant: HomeVariant;
  revealVariant: "v1" | "v2";
  world: WorldSnapshot;
  economy: EconomyState;
  setOnboarding: (space: AppSpace, me: AppUser) => void;
  updateToday: (patch: Partial<AppToday>) => void;
  submitCheckin: (patch: Pick<AppToday, "myMood" | "myEnergy" | "myWant" | "myNote">) => void;
  setPartnerDemo: () => void;
  addStory: (entry: StoryEntry) => void;
  togglePlanned: (id: string) => void;
  answerQuestion: (answer: string) => void;
  voteWho: (id: string, vote: string) => void;
  hydrate: (payload: Partial<Pick<AppState, "space" | "me" | "partner" | "today" | "story" | "plannedActivities" | "world" | "economy">>) => void;
  rolloverIfNeeded: () => void;
  setHomeVariant: (variant: HomeVariant) => void;
  setRevealVariant: (variant: "v1" | "v2") => void;
  setStyle: (style: WegoStyle) => void;
  performWorldAction: (type: WorldActionType, objectId?: RoomObjectId, itemId?: string) => { message: string; reward: number };
  interactRoom: (interaction: RoomInteraction) => { message: string; reward: number };
  unlockWithSparks: (itemId: string, price: number) => boolean;
  equipRoomItem: (itemId: string) => boolean;
  unequipRoomItem: (slot: RoomSlot) => boolean;
  equipWegoItem: (itemId: string) => boolean;
  unequipWegoItem: (slot: "accessory" | "emotion") => boolean;
  addSharedPlan: (title: string, date: string) => void;
  completeSharedPlan: (id: string) => void;
  addMemory: (title: string, body: string, kind?: MemoryEntry["kind"]) => void;
  setRoomVibe: (vibe: RoomVibe) => { message: string; reward: number };
  startMoveIn: () => { message: string; reward: number };
  placeFirstFurniture: () => { message: string; reward: number };
  performRitual: (ritual: RitualId) => { message: string; reward: number };
  sendPartnerPulse: (kind: PartnerPulseKind) => { message: string; reward: number };
  answerChooseVibe: (answer: RoomVibe) => { message: string; reward: number };
  answerPartnerChooseVibe: (answer: RoomVibe) => { message: string; reward: number };
  claimDailyQuest: () => boolean;
  pinMemory: (memoryId: string) => boolean;
  reset: () => void;
}

const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const currentDate = (timezone = browserTimezone): string => { try { return getSpaceDate(new Date(), timezone); } catch { return new Date().toISOString().slice(0, 10); } };
const emptyToday = (date = currentDate()): AppToday => ({ date, myMood: null, myEnergy: null, myWant: null, myNote: "", myGuess: null, partnerMood: null, partnerEnergy: null, partnerWant: null, partnerNote: null, revealed: false });
const defaults = { space: null, me: null, partner: null, today: emptyToday(), story: [] as StoryEntry[], plannedActivities: [] as string[], dailyQuestion: { id: "q1", text: "Что тебе хочется получить от меня сейчас?", options: ["Объятия", "Немного тишины"], myAnswer: null, partnerAnswered: false, partnerAnswer: null }, whoPrompts: [{ id: "w1", text: "Кто первым сорвётся завтра в путешествие?", left: "Я", right: "Партнёр", myVote: null, partnerVote: null }], homeVariant: "v1" as HomeVariant, revealVariant: "v1" as "v1" | "v2", world: createInitialWorld(), economy: createInitialEconomy("local-preview", currentDate()) };
const persisted = readLocalState<typeof defaults>(defaults);
const initial = { ...defaults, ...persisted, world: normalizeWorld(persisted.world, new Date().toISOString()), economy: normalizeEconomy(persisted.economy ?? defaults.economy, currentDate()) };

function persist(state: AppState): void {
  const { setOnboarding: _a, updateToday: _b, submitCheckin: _bb, setPartnerDemo: _c, addStory: _d, togglePlanned: _e, answerQuestion: _f, voteWho: _g, hydrate: _h, rolloverIfNeeded: _i, setHomeVariant: _j, setRevealVariant: _k, setStyle: _l, performWorldAction: _n, interactRoom: _nn, unlockWithSparks: _o, equipRoomItem: _p0, unequipRoomItem: _p1, equipWegoItem: _p2, unequipWegoItem: _p3, addSharedPlan: _q, completeSharedPlan: _r, addMemory: _s, setRoomVibe: _t, startMoveIn: _t0, placeFirstFurniture: _t1, performRitual: _u, sendPartnerPulse: _v, answerChooseVibe: _w, answerPartnerChooseVibe: _x, claimDailyQuest: _y, pinMemory: _z, reset: _m, ...serializable } = state;
  writeLocalState(serializable);
}

export const useAppStore = create<AppState>((set, get) => {
  const commit = (next: Partial<AppState>) => set((state) => { const value = { ...state, ...next }; queueMicrotask(() => persist(value)); return value; });
  const commitWorldAction = (action: WorldAction): { message: string; reward: number } => {
    const state = get();
    const result = reduceWorld(state.world, action);
    let economy = state.economy;
    let reward = 0;
    if (result.reward && canEarnDaily(economy, result.reward.amount, action.at.slice(0, 10), DAILY_SPARK_CAP)) {
      economy = applySparkTransaction(economy, { id: `ledger-${action.id}`, userId: economy.wallet.userId, amount: result.reward.amount, reason: result.reward.reason, idempotencyKey: result.reward.idempotencyKey, createdAt: action.at, metadata: { action: action.type } });
      reward = result.reward.amount;
    }
    const newMemory = result.snapshot.memories.find((memory) => memory.id === `memory-${action.id}`);
    const story = newMemory && !state.story.some((entry) => entry.sourceId === newMemory.id)
      ? [{ id: `story-${newMemory.id}`, sourceId: newMemory.id, sourceType: "activity" as const, date: newMemory.createdAt.slice(0, 10), type: "activity" as const, title: newMemory.title, body: newMemory.body, tone: newMemory.tone, createdAt: newMemory.createdAt }, ...state.story]
      : state.story;
    commit({ world: result.snapshot, economy, story });
    void syncWorldAction(action);
    return { message: result.message, reward };
  };
  return {
    ...initial,
    setOnboarding: (space, me) => commit({ space, me, partner: null, today: emptyToday(currentDate(space.timezone)), world: createInitialWorld(), economy: createInitialEconomy(me.id, currentDate(space.timezone)) }),
    updateToday: (patch) => commit({ today: { ...get().today, ...patch } }),
    submitCheckin: (patch) => {
      const state = get();
      const date = state.today.date;
      let economy = normalizeEconomy(state.economy, date);
      const userId = state.me?.id ?? "local-preview";
      for (const reward of checkinRewardInputs(userId, date, Boolean(state.today.partnerMood))) {
        if (!canEarnDaily(economy, reward.amount, date, DAILY_SPARK_CAP)) continue;
        economy = applySparkTransaction(economy, { ...reward, userId, createdAt: new Date().toISOString() });
      }
      commit({ today: { ...state.today, ...patch }, economy });
    },
    setPartnerDemo: () => {
      const state = get();
      const today = { ...state.today, partnerMood: "calm" as const, partnerEnergy: "low" as const, partnerWant: "together" as const, partnerNote: "Сегодня хочется тишины рядом." };
      let economy = state.economy;
      if (state.today.myMood) {
        for (const reward of checkinRewardInputs(state.me?.id ?? "local-preview", state.today.date, true).slice(1)) {
          if (canEarnDaily(economy, reward.amount, state.today.date, DAILY_SPARK_CAP)) economy = applySparkTransaction(economy, { ...reward, userId: state.me?.id ?? "local-preview", createdAt: new Date().toISOString() });
        }
      }
      commit({ partner: { id: "partner-local", name: "Аружан", tone: "lilac" }, today, economy });
    },
    addStory: (entry) => { if (get().story.some((item) => item.id === entry.id || (entry.sourceId && item.sourceId === entry.sourceId))) return; commit({ story: [entry, ...get().story] }); },
    togglePlanned: (id) => commit({ plannedActivities: get().plannedActivities.includes(id) ? get().plannedActivities.filter((item) => item !== id) : [...get().plannedActivities, id] }),
    answerQuestion: (answer) => commit({ dailyQuestion: { ...get().dailyQuestion, myAnswer: answer } }),
    voteWho: (id, vote) => commit({ whoPrompts: get().whoPrompts.map((item) => item.id === id ? { ...item, myVote: vote } : item) }),
    hydrate: (payload) => commit({ ...payload, ...(payload.world ? { world: normalizeWorld(payload.world) } : {}) }),
    rolloverIfNeeded: () => { const state = get(); if (!state.space) return; const date = currentDate(state.space.timezone); if (date === state.today.date) return; commit({ space: { ...state.space, daysAlive: state.space.daysAlive + 1 }, today: emptyToday(date) }); },
    setHomeVariant: (homeVariant) => commit({ homeVariant }),
    setRevealVariant: (revealVariant) => commit({ revealVariant }),
    setStyle: (style) => commit({ space: get().space ? { ...get().space!, style, room: style === "a" ? "warm" : "morning" } : null }),
    performWorldAction: (type, objectId, itemId) => {
      const state = get();
      const at = new Date().toISOString();
      const action = { id: `local-${type}-${Date.now()}`, type, actorId: state.me?.id ?? "local-preview", objectId, itemId, at };
      const result = reduceWorld(state.world, action);
      let economy = state.economy;
      let reward = 0;
      const guardedAction = type === "pet" || type === "memory" || type === "play" ? type : null;
      const rewardAllowed = result.reward && (guardedAction ? canRewardAction(economy, { action: guardedAction, amount: result.reward.amount, at, gameId: objectId }).allowed : canEarnDaily(economy, result.reward.amount, at.slice(0, 10), DAILY_SPARK_CAP));
      if (result.reward && rewardAllowed) {
        economy = applySparkTransaction(economy, { id: `ledger-${action.id}`, userId: economy.wallet.userId, amount: result.reward.amount, reason: result.reward.reason, idempotencyKey: result.reward.idempotencyKey, createdAt: at, metadata: { action: type } });
        if (guardedAction) economy = markRewardedAction(economy, { action: guardedAction, amount: result.reward.amount, at, gameId: objectId });
        reward = result.reward.amount;
      }
      commit({ world: result.snapshot, economy });
      void syncWorldAction(action);
      return { message: result.message, reward };
    },
    interactRoom: (interaction) => {
      const state = get();
      const at = new Date().toISOString();
      const action = { id: `local-room-${interaction.objectId}-${interaction.interaction}-${Date.now()}`, type: "room_interact" as const, actorId: state.me?.id ?? "local-preview", objectId: interaction.objectId as RoomObjectId, interaction: interaction.interaction, at };
      const result = reduceWorld(state.world, action);
      commit({ world: result.snapshot });
      void syncWorldAction(action);
      return { message: result.message, reward: 0 };
    },
    unlockWithSparks: (itemId, price) => {
      const state = get();
      if (!getCatalogItem(itemId) || !Number.isInteger(price) || price <= 0 || state.world.unlockedItemIds.includes(itemId) || state.economy.wallet.balance < price) return false;
      const at = new Date().toISOString();
      const nextEconomy = applySparkTransaction(state.economy, { id: `purchase-${itemId}-${Date.now()}`, userId: state.economy.wallet.userId, amount: -price, reason: "purchase", idempotencyKey: `purchase-${itemId}`, createdAt: at, metadata: { itemId } });
      if (nextEconomy === state.economy) return false;
      commit({ economy: nextEconomy, world: { ...state.world, unlockedItemIds: [...state.world.unlockedItemIds, itemId], updatedAt: at } });
      return true;
    },
    equipRoomItem: (itemId) => {
      const state = get();
      const item = getCatalogItem(itemId);
      if (!item || item.slot === null || !state.world.unlockedItemIds.includes(itemId) || !canEquipItem(itemId, { type: "room", slot: item.slot as RoomSlot })) return false;
      const at = new Date().toISOString();
      const world = { ...state.world, equippedRoomItems: { ...state.world.equippedRoomItems, [item.slot]: itemId }, updatedAt: at };
      commit({ world });
      void syncWorldEquipment(world);
      return true;
    },
    unequipRoomItem: (slot) => {
      const state = get();
      if (!state.world.equippedRoomItems[slot]) return false;
      const world = { ...state.world, equippedRoomItems: { ...state.world.equippedRoomItems, [slot]: null }, updatedAt: new Date().toISOString() };
      commit({ world });
      void syncWorldEquipment(world);
      return true;
    },
    equipWegoItem: (itemId) => {
      const state = get();
      const item = getCatalogItem(itemId);
      if (!item || !state.world.unlockedItemIds.includes(itemId) || (item.slot !== "outfit" && item.slot !== "accessory" && item.slot !== "emotion") || !canEquipItem(itemId, { type: "wego", slot: item.slot })) return false;
      const at = new Date().toISOString();
      const equipped = { ...state.world.equippedWegoItems, [item.slot]: itemId };
      const world = { ...state.world, equippedWegoItems: equipped, outfitId: equipped.outfit, updatedAt: at };
      commit({ world });
      void syncWorldEquipment(world);
      return true;
    },
    unequipWegoItem: (slot) => {
      const state = get();
      if (!state.world.equippedWegoItems[slot]) return false;
      const world = { ...state.world, equippedWegoItems: { ...state.world.equippedWegoItems, [slot]: null }, updatedAt: new Date().toISOString() };
      commit({ world });
      void syncWorldEquipment(world);
      return true;
    },
    addSharedPlan: (title, date) => {
      const state = get();
      const plan: SharedPlan = { id: `plan-${Date.now()}`, title: title.trim(), date, createdBy: state.me?.id ?? "local-preview", completedBy: [], tone: "lilac" };
      commit({ world: { ...state.world, plans: [plan, ...state.world.plans], updatedAt: new Date().toISOString() } });
    },
    completeSharedPlan: (id) => {
      const state = get();
      const actorId = state.me?.id ?? "local-preview";
      const plan = state.world.plans.find((item) => item.id === id);
      if (!plan || plan.completedBy.includes(actorId)) return;
      const result = reduceWorld(state.world, { id: `complete-${id}-${actorId}`, type: "plan_complete", actorId, at: new Date().toISOString() });
      const plans = result.snapshot.plans.map((item) => item.id === id ? { ...item, completedBy: [...item.completedBy, actorId] } : item);
      let economy = state.economy;
      if (result.reward && canEarnDaily(economy, result.reward.amount, result.snapshot.updatedAt.slice(0, 10))) economy = applySparkTransaction(economy, { id: `ledger-${id}-${actorId}`, userId: economy.wallet.userId, amount: result.reward.amount, reason: "plan", idempotencyKey: result.reward.idempotencyKey, createdAt: result.snapshot.updatedAt, metadata: { planId: id } });
      commit({ world: { ...result.snapshot, plans }, economy });
    },
    addMemory: (title, body, kind = "note") => {
      const state = get();
      const at = new Date().toISOString();
      const memory: MemoryEntry = { id: `memory-${Date.now()}`, title: title.trim(), body: body.trim(), createdAt: at, kind, tone: "yellow" };
      const result = reduceWorld(state.world, { id: memory.id, type: "memory", actorId: state.me?.id ?? "local-preview", at });
      let economy = state.economy;
      if (result.reward && canEarnDaily(economy, result.reward.amount, at.slice(0, 10))) economy = applySparkTransaction(economy, { id: `ledger-${memory.id}`, userId: economy.wallet.userId, amount: result.reward.amount, reason: "memory", idempotencyKey: result.reward.idempotencyKey, createdAt: at, metadata: { memoryId: memory.id } });
      commit({ world: { ...result.snapshot, memories: [memory, ...state.world.memories] }, economy });
    },
    setRoomVibe: (vibe) => {
      const state = get();
      return commitWorldAction({ id: `local-vibe-${Date.now()}`, type: "set_vibe", actorId: state.me?.id ?? "local-preview", vibe, at: new Date().toISOString() });
    },
    startMoveIn: () => {
      const state = get();
      return commitWorldAction({ id: `local-move-in-start-${Date.now()}`, type: "move_in_start", actorId: state.me?.id ?? "local-preview", at: new Date().toISOString() });
    },
    placeFirstFurniture: () => {
      const state = get();
      const moveInItem: MoveInItemId = "rug";
      return commitWorldAction({ id: `local-move-in-place-${moveInItem}-${Date.now()}`, type: "move_in_place", actorId: state.me?.id ?? "local-preview", moveInItem, at: new Date().toISOString() });
    },
    performRitual: (ritual) => {
      const state = get();
      return commitWorldAction({ id: `local-ritual-${ritual}-${Date.now()}`, type: "ritual", actorId: state.me?.id ?? "local-preview", ritual, at: new Date().toISOString() });
    },
    sendPartnerPulse: (pulseKind) => {
      const state = get();
      return commitWorldAction({ id: `local-pulse-${pulseKind}-${Date.now()}`, type: "pulse", actorId: state.me?.id ?? "local-preview", pulseKind, at: new Date().toISOString() });
    },
    answerChooseVibe: (gameAnswer) => {
      const state = get();
      return commitWorldAction({ id: `local-game-${Date.now()}`, type: "game_answer", actorId: state.me?.id ?? "local-preview", gameAnswer, at: new Date().toISOString() });
    },
    answerPartnerChooseVibe: (gameAnswer) => {
      const state = get();
      return commitWorldAction({ id: `local-game-partner-${Date.now()}`, type: "game_answer", actorId: state.partner?.id ?? "partner-local", gameAnswer, at: new Date().toISOString() });
    },
    claimDailyQuest: () => {
      if (get().world.cozy.dailyQuest.status === "claimed") return false;
      const state = get();
      commitWorldAction({ id: `local-quest-${Date.now()}`, type: "quest_claim", actorId: state.me?.id ?? "local-preview", at: new Date().toISOString() });
      return get().world.cozy.dailyQuest.status === "claimed";
    },
    pinMemory: (memoryId) => {
      const state = get();
      if (!state.world.memories.some((memory) => memory.id === memoryId)) return false;
      const pinned = state.world.cozy.memoryWall;
      const memoryWall = pinned.includes(memoryId) ? pinned.filter((id) => id !== memoryId) : [memoryId, ...pinned].slice(0, 5);
      commit({ world: { ...state.world, updatedAt: new Date().toISOString(), cozy: { ...state.world.cozy, memoryWall } } });
      return true;
    },
    reset: () => { writeLocalState(defaults); set({ ...defaults }); },
  };
});

async function syncWorldAction(action: WorldAction): Promise<void> {
  try {
    const { apiFetch, isApiEnabled } = await import("../lib/api-client");
    if (!isApiEnabled()) return;
    const response = await apiFetch<{ world: WorldSnapshot }>("/world/actions", { method: "POST", body: JSON.stringify(action) });
    useAppStore.setState({ world: normalizeWorld(response.world) });
  } catch {
    // Local-first state remains authoritative until the next successful bootstrap.
  }
}

async function syncWorldEquipment(world: WorldSnapshot): Promise<void> {
  try {
    const { apiFetch, isApiEnabled } = await import("../lib/api-client");
    if (!isApiEnabled()) return;
    const response = await apiFetch<{ world: WorldSnapshot }>("/world/equipment", { method: "PUT", body: JSON.stringify({ equippedRoomItems: world.equippedRoomItems, equippedWegoItems: world.equippedWegoItems }) });
    useAppStore.setState({ world: normalizeWorld(response.world) });
  } catch {
    // Equipment stays available locally until the API is reachable again.
  }
}
