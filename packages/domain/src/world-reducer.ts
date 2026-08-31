import { defaultRoomEnvironment, type RoomEnvironmentState } from "./room-state";
import { memoryCopyFor, type RoomVibe, type WegoPose } from "./cozy-world";
import type { MemoryEntry, WorldAction, WorldActionResult, WorldSnapshot, WorldReward, WegoNeeds } from "./world";

const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));
const adjust = (needs: WegoNeeds, patch: Partial<WegoNeeds>): WegoNeeds => {
  const next = { ...needs };
  for (const key of Object.keys(patch) as Array<keyof WegoNeeds>) next[key] = clamp(needs[key] + (patch[key] ?? 0));
  return next;
};

const rewards: Partial<Record<WorldAction["type"], WorldReward>> = {
  feed: { idempotencyKey: "", amount: 6, reason: "care", label: "+6 Искр за заботу" },
  pet: { idempotencyKey: "", amount: 4, reason: "care", label: "+4 Искры за нежность" },
  play: { idempotencyKey: "", amount: 8, reason: "play", label: "+8 Искр за игру" },
  tidy: { idempotencyKey: "", amount: 5, reason: "tidy", label: "+5 Искр за уют" },
  plan_complete: { idempotencyKey: "", amount: 15, reason: "plan", label: "+15 Искр за общий план" },
  memory: { idempotencyKey: "", amount: 12, reason: "memory", label: "+12 Искр за память" },
};

function appendAction(snapshot: WorldSnapshot, action: WorldAction): Pick<WorldSnapshot, "updatedAt" | "actionKeys"> {
  return { updatedAt: action.at, actionKeys: [...snapshot.actionKeys, action.id].slice(-500) };
}

function memory(id: string, title: string, body: string, createdAt: string, kind: MemoryEntry["kind"], tone: MemoryEntry["tone"] = "yellow"): MemoryEntry {
  return { id, title, body, createdAt, kind, tone };
}

function vibePose(vibe: RoomVibe): WegoPose {
  if (vibe === "tiny-party") return "party";
  if (vibe === "night-cozy") return "cozy";
  if (vibe === "rainy-date") return "curious";
  if (vibe === "study-buddy") return "waiting";
  return "idle";
}

function advanceMoveIn(cozy: WorldSnapshot["cozy"], action: WorldAction): WorldSnapshot["cozy"] {
  if (cozy.roomPhase !== "move-in") return cozy;
  if (cozy.moveInStep === "meet-wego" && action.type === "pet") return { ...cozy, moveInStep: "first-ritual", pose: "happy" };
  return cozy;
}

function cozyTransition(snapshot: WorldSnapshot, action: WorldAction): WorldActionResult | null {
  if (action.type === "move_in_start") {
    if (snapshot.cozy.roomPhase !== "showcase") return { snapshot: { ...snapshot, ...appendAction(snapshot, action) }, reward: null, message: "Вего уже живёт в вашей комнате." };
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, roomPhase: "move-in", moveInStep: "meet-wego", roomBuildLevel: 0, pose: "curious" } }, reward: null, message: "Вего: «Я переезжаю к вам. Поможешь найти мне первый уголок?»" };
  }
  if (action.type === "move_in_place" && action.moveInItem === "rug") {
    if (snapshot.cozy.roomPhase !== "move-in" || snapshot.cozy.moveInStep !== "first-furniture") return { snapshot: { ...snapshot, ...appendAction(snapshot, action) }, reward: null, message: "Сначала Вего хочет освоиться в новой комнате." };
    const entry = memory(`memory-${action.id}`, "Первый угол", "Вы расстелили первый коврик — теперь это уже ваш общий дом.", action.at, "care", "mint");
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), memories: [entry, ...snapshot.memories].slice(0, 100), cozy: { ...snapshot.cozy, roomPhase: "settled", moveInStep: "complete", roomBuildLevel: 1, pose: "happy" } }, reward: { idempotencyKey: action.id, amount: 10, reason: "tidy", label: "+10 Искр за первый уголок" }, message: "Первый уголок готов. Теперь можно обустраивать комнату вместе." };
  }
  if (action.type === "set_vibe" && action.vibe) {
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, vibe: action.vibe, pose: vibePose(action.vibe) } }, reward: null, message: action.vibe === "tiny-party" ? "В комнате включился маленький праздник." : "Комната поймала новый вайб." };
  }
  if (action.type === "ritual" && action.ritual) {
    const details = {
      tea: { title: "Вечерний чай", body: "Чайник тихо закипел для вас двоих.", pose: "cozy" as const, needs: { comfort: 5, connection: 4 }, reward: { amount: 4, reason: "care" as const, label: "+4 Искры за уют" } },
      blanket: { title: "Плед для Вего", body: "Вего устроился поудобнее рядом.", pose: "cozy" as const, needs: { comfort: 7 }, reward: { amount: 4, reason: "care" as const, label: "+4 Искры за заботу" } },
      dance: { title: "Танец в комнате", body: "Вего станцевал маленький танец для вас.", pose: "party" as const, needs: { joy: 8, energy: -2 }, reward: { amount: 5, reason: "play" as const, label: "+5 Искр за танец" } },
      photo: { title: "Кадр на память", body: "Этот ламповый момент остался в вашей истории.", pose: "happy" as const, needs: { connection: 5 }, reward: { amount: 4, reason: "memory" as const, label: "+4 Искры за момент" } },
      snack: { title: "Вкусный перекус", body: "Вего довольно похрустел угощением.", pose: "happy" as const, needs: { hunger: 9, joy: 2 }, reward: { amount: 3, reason: "care" as const, label: "+3 Искры за перекус" } },
      hug: { title: "Обнимашка рядом", body: "В комнате стало заметно теплее.", pose: "happy" as const, needs: { connection: 8, comfort: 3 }, reward: { amount: 4, reason: "care" as const, label: "+4 Искры за близость" } },
    }[action.ritual];
    const entry = memory(`memory-${action.id}`, details.title, details.body, action.at, "care", action.ritual === "dance" ? "lilac" : "coral");
    const moveInStep = snapshot.cozy.roomPhase === "move-in" && snapshot.cozy.moveInStep === "first-ritual" ? "first-furniture" : snapshot.cozy.moveInStep;
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), needs: adjust(snapshot.needs, details.needs), mood: details.pose === "party" ? "playful" : "loved", memories: [entry, ...snapshot.memories].slice(0, 100), cozy: { ...snapshot.cozy, moveInStep, pose: details.pose } }, reward: { idempotencyKey: action.id, ...details.reward }, message: details.body };
  }
  if (action.type === "pulse" && action.pulseKind) {
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, pose: "waiting", pulses: [{ id: `pulse-${action.id}`, kind: action.pulseKind, createdAt: action.at, createdBy: action.actorId, status: "sent" as const }, ...snapshot.cozy.pulses].slice(0, 20) } }, reward: null, message: "Тёплый знак уже ждёт партнёра в комнате." };
  }
  if (action.type === "game_answer" && action.gameAnswer) {
    const game = snapshot.cozy.game;
    if (!game || game.status === "completed") {
      return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, pose: "waiting", game: { id: `game-${action.id}`, type: "choose-vibe", status: "waiting", createdBy: action.actorId, myAnswer: action.gameAnswer, partnerAnswer: null, result: null, createdAt: action.at } } }, reward: null, message: "Выбор сохранён — ждём партнёра." };
    }
    if (game.createdBy === action.actorId) return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, game: { ...game, myAnswer: action.gameAnswer } } }, reward: null, message: "Выбор обновлён — ждём партнёра." };
    const result = game.myAnswer === action.gameAnswer ? "match" : "mixed";
    const copy = memoryCopyFor("pair-game", game.myAnswer ?? action.gameAnswer);
    const entry = memory(`memory-${action.id}`, result === "match" ? copy.title : "Два вайба рядом", result === "match" ? copy.body : "Ваши ответы разные, но вечер всё равно общий.", action.at, "game", result === "match" ? "lilac" : "mint");
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), needs: adjust(snapshot.needs, { connection: 7, joy: 4 }), memories: [entry, ...snapshot.memories].slice(0, 100), cozy: { ...snapshot.cozy, pose: "happy", game: { ...game, status: "completed", partnerAnswer: action.gameAnswer, result } } }, reward: { idempotencyKey: action.id, amount: 8, reason: "play", label: "+8 Искр за игру вдвоём" }, message: result === "match" ? "Вы поймали один вайб." : "Два настроения красиво встретились." };
  }
  if (action.type === "quest_claim") {
    if (snapshot.cozy.dailyQuest.status === "claimed") return { snapshot, reward: null, message: "Эта капсула уже в твоей коллекции." };
    return { snapshot: { ...snapshot, ...appendAction(snapshot, action), cozy: { ...snapshot.cozy, dailyQuest: { ...snapshot.cozy.dailyQuest, status: "claimed" } } }, reward: { idempotencyKey: action.id, amount: snapshot.cozy.dailyQuest.reward, reason: "daily", label: `+${snapshot.cozy.dailyQuest.reward} Искр за сегодняшний ритуал` }, message: "Капсула заботы уже в твоей коллекции." };
  }
  return null;
}

function roomInteractionTransition(snapshot: WorldSnapshot, action: WorldAction): { environment: RoomEnvironmentState; objectId: "lamp" | "window" | "table" | "plant"; needs: Partial<WegoNeeds>; message: string } | null {
  if (action.type !== "room_interact" || !action.objectId || !action.interaction) return null;
  const environment = { ...defaultRoomEnvironment(), ...snapshot.environment };
  if (action.objectId === "lamp" && action.interaction === "toggle") return { environment: { ...environment, lamp: environment.lamp === "on" ? "off" : "on" }, objectId: "lamp", needs: { comfort: 2 }, message: environment.lamp === "on" ? "свет погас — Вего устроился поуютнее." : "Тёплый свет снова наполнил комнату." };
  if (action.objectId === "window" && action.interaction === "toggle-curtains") return { environment: { ...environment, curtains: environment.curtains === "open" ? "closed" : "open" }, objectId: "window", needs: { comfort: 2 }, message: environment.curtains === "open" ? "Шторы закрылись — стало тише." : "Шторы открылись, и в комнату вошел свет." };
  if (action.objectId === "table" && action.interaction === "serve-tea" && environment.table === "empty") return { environment: { ...environment, table: "tea-ready" }, objectId: "table", needs: { connection: 3, comfort: 2 }, message: "Чайник налился — можно устроить маленький перерыв." };
  if (action.objectId === "table" && action.interaction === "serve-tea") return { environment, objectId: "table", needs: {}, message: "Чай уже налит — он ждёт вас на столике." };
  if (action.objectId === "table" && action.interaction === "collect-tea" && environment.table === "tea-ready") return { environment: { ...environment, table: "empty" }, objectId: "table", needs: { connection: 4, comfort: 3 }, message: "Выпит чай вдвоём — стало немного теплее." };
  if (action.objectId === "table" && action.interaction === "collect-tea") return { environment, objectId: "table", needs: {}, message: "На столике пока нет готового чая." };
  if (action.objectId === "plant" && action.interaction === "water") return { environment: { ...environment, plants: "healthy" }, objectId: "plant", needs: { comfort: 3, joy: 2 }, message: "Растения ожили — Вего довольно качнул листочками." };
  return null;
}

export function reduceWorld(snapshot: WorldSnapshot, action: WorldAction): WorldActionResult {
  if (snapshot.actionKeys.includes(action.id)) return { snapshot, reward: null, message: "Это действие уже сохранено." };
  const cozy = cozyTransition(snapshot, action);
  if (cozy) return cozy;
  const now = action.at;
  const roomTransition = roomInteractionTransition(snapshot, action);
  if (action.type === "room_interact" && !roomTransition) return { snapshot, reward: null, message: "С этим предметом сейчас ничего нельзя сделать." };
  const nextNeeds = roomTransition ? adjust(snapshot.needs, roomTransition.needs)
    : action.type === "feed" ? adjust(snapshot.needs, { hunger: 22, comfort: 3 })
    : action.type === "pet" ? adjust(snapshot.needs, { connection: 14, comfort: 7 })
      : action.type === "play" ? adjust(snapshot.needs, { joy: 22, energy: -8, connection: 5 })
        : action.type === "tidy" ? adjust(snapshot.needs, { comfort: 16, joy: 4 })
          : action.type === "plan_complete" ? adjust(snapshot.needs, { connection: 10, joy: 8 })
            : action.type === "memory" ? adjust(snapshot.needs, { connection: 8, comfort: 6 }) : snapshot.needs;
  const objectId = roomTransition?.objectId ?? action.objectId;
  const roomObjects = objectId && snapshot.roomObjects[objectId]
    ? { ...snapshot.roomObjects, [objectId]: { ...snapshot.roomObjects[objectId], level: snapshot.roomObjects[objectId].level + (action.type === "decorate" ? 1 : 0), lastInteractedAt: now } }
    : snapshot.roomObjects;
  const rewardTemplate = rewards[action.type];
  const reward = rewardTemplate ? { ...rewardTemplate, idempotencyKey: action.id } : null;
  const nextAverage = Object.values(nextNeeds).reduce((sum, value) => sum + value, 0) / Object.values(nextNeeds).length;
  return {
    snapshot: {
      ...snapshot,
      ...appendAction(snapshot, action),
      needs: nextNeeds,
      mood: nextNeeds.joy > 78 ? "playful" : nextNeeds.energy < 30 ? "sleepy" : nextNeeds.connection > 78 ? "loved" : nextNeeds.comfort > 68 ? "cozy" : "curious",
      affection: clamp(snapshot.affection + (action.type === "pet" || action.type === "feed" ? 2 : 1)),
      level: Math.max(snapshot.level, Math.floor((snapshot.affection + 12) / 25)),
      interactionStreak: snapshot.interactionStreak + 1,
      roomObjects,
      environment: roomTransition?.environment ?? snapshot.environment ?? defaultRoomEnvironment(),
      outfitId: action.type === "outfit" && action.itemId ? action.itemId : snapshot.outfitId,
      cozy: advanceMoveIn(snapshot.cozy, action),
    },
    reward: nextAverage >= 0 ? reward : null,
    message: roomTransition?.message ?? (action.type === "feed" ? "Вего довольно мурлыкнул — стало уютнее." : action.type === "pet" ? "Вего потянулся к руке." : action.type === "play" ? "Игрушка зашуршала, настроение поднялось." : action.type === "tidy" ? "Комната стала чуть спокойнее." : action.type === "decorate" ? "Вего внимательно разглядывает обновление." : action.type === "plan_complete" ? "Общий план стал частью вашей истории." : action.type === "memory" ? "Новая маленькая память сохранена." : "Вего примеряет новое настроение."),
  };
}
