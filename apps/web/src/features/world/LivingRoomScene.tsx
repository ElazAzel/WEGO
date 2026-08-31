import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { welcomeBackMessage } from "@wego/domain";
import type { RoomObjectId, RoomInteraction, WegoStage, WegoStyle, WorldSnapshot } from "@wego/domain";
import { roomAsset, roomBackgroundAsset } from "../../lib/asset";
import { haptic } from "../../lib/telegram";
import { useAppStore, type WorldActionType } from "../../store/use-app-store";
import { useUiStore } from "../../store/use-ui-store";
import { getWegoSceneAsset, getWegoSceneFallback, type WegoSceneState } from "./asset-manifest";
import { roomInteractionFor, roomSpriteAsset, roomSprites } from "./room-sprite-manifest";
import { cozyObjectSprites, type CozyObjectAction } from "./cozy-world-manifest";
import { MoveInGuide } from "./MoveInGuide";
import { RoomIntro } from "./RoomIntro";
import { CozyToast, type CozyFeedback } from "./CozyToast";
import { MemoryWall } from "./MemoryWall";
import { roomRendererForFlag } from "./game-scene";

const PixiRoomScene = lazy(() => import("./PixiRoomScene"));

interface LivingRoomSceneProps {
  room: "warm" | "morning";
  style: WegoStyle;
  stage: WegoStage;
  daysAlive: number;
  character: string;
}

export function LivingRoomScene({ room, style, stage, daysAlive, character }: LivingRoomSceneProps) {
  const performWorldAction = useAppStore((state) => state.performWorldAction);
  const interactRoom = useAppStore((state) => state.interactRoom);
  const world = useAppStore((state) => state.world);
  const setRoomVibe = useAppStore((state) => state.setRoomVibe);
  const sendPartnerPulse = useAppStore((state) => state.sendPartnerPulse);
  const claimDailyQuest = useAppStore((state) => state.claimDailyQuest);
  const startMoveIn = useAppStore((state) => state.startMoveIn);
  const placeFirstFurniture = useAppStore((state) => state.placeFirstFurniture);
  const openSheet = useUiStore((state) => state.openSheet);
  const [sceneState, setSceneState] = useState<WegoSceneState>("idle");
  const [feedback, setFeedback] = useState<CozyFeedback | null>(null);
  const [characterLine, setCharacterLine] = useState("Я рядом. Давай сделаем это место нашим.");
  const welcomeBack = welcomeBackMessage(world.updatedAt);
  const fallback = getWegoSceneFallback(style, stage);
  const roomPhase = world.cozy.roomPhase;
  const moveInStep = world.cozy.moveInStep;
  const roomRenderer = roomRendererForFlag(import.meta.env.VITE_USE_PIXI_SCENE);
  const notify = useCallback((next: { message: string; reward: number }) => setFeedback({ message: next.message, reward: next.reward }), []);
  const runAction = useCallback((type: WorldActionType, objectId?: RoomObjectId) => {
    haptic("light");
    const result = performWorldAction(type, objectId);
    setSceneState(type === "pet" ? "pet" : "idle");
    if (type === "pet") setCharacterLine(roomPhase === "move-in" ? "О, ты пришёл. Здесь правда будет мой уголок?" : "Вот это забота. Я тоже тебя обнимаю.");
    notify(result);
    window.setTimeout(() => setSceneState("idle"), 900);
  }, [notify, performWorldAction, roomPhase]);
  const runStartMoveIn = useCallback(() => {
    haptic("light");
    notify(startMoveIn());
  }, [notify, startMoveIn]);
  const runPlaceFirstFurniture = useCallback(() => {
    haptic("light");
    notify(placeFirstFurniture());
  }, [notify, placeFirstFurniture]);
  const runRoomInteraction = useCallback((interaction: RoomInteraction) => {
    haptic("light");
    notify(interactRoom(interaction));
  }, [interactRoom, notify]);
  const runCozyAction = useCallback((action: CozyObjectAction) => {
    haptic("light");
    if (action === "open-vibes") return openSheet("vibes");
    if (action === "open-memories") return openSheet("memories");
    if (action === "open-game") return openSheet("games");
    if (action === "open-wardrobe") return openSheet("wardrobe");
    if (action === "send-pulse") return notify(sendPartnerPulse("heart"));
    if (action === "claim-quest") {
      if (roomPhase === "move-in" && moveInStep === "first-furniture") return runPlaceFirstFurniture();
      const claimed = claimDailyQuest();
      return notify(claimed ? { message: "Капсула заботы уже в твоей коллекции.", reward: world.cozy.dailyQuest.reward } : { message: "Эта капсула уже открыта сегодня.", reward: 0 });
    }
    return notify(setRoomVibe(world.cozy.vibe === "night-cozy" ? "slow-morning" : "night-cozy"));
  }, [claimDailyQuest, moveInStep, notify, openSheet, roomPhase, runPlaceFirstFurniture, sendPartnerPulse, setRoomVibe, world.cozy.dailyQuest.reward, world.cozy.vibe]);

  useEffect(() => {
    const lines = roomPhase === "showcase"
      ? ["Смотри, сколько здесь можно придумать вместе.", "Когда-нибудь это станет вашим настоящим уголком."]
      : roomPhase === "move-in"
        ? moveInStep === "first-ritual"
          ? ["Я немного освоился. Чем займёмся в первый вечер?", "Выбери для нас маленький ритуал."]
          : moveInStep === "first-furniture"
            ? ["Мне уже нравится быть здесь.", "Поставим коврик — и у меня будет свой уголок."]
            : ["Я переехал к вам.", "Куда поставим мой первый коврик?"]
        : world.cozy.vibe === "tiny-party"
          ? ["Музыку погромче?", "Этот уголок так и просит маленький праздник."]
          : ["Мне хорошо в нашем уголке.", "Можно ещё немного посидеть рядом."];
    let index = 0;
    setCharacterLine(lines[index]);
    const timer = window.setInterval(() => {
      index = (index + 1) % lines.length;
      setCharacterLine(lines[index]);
    }, 7600);
    return () => window.clearInterval(timer);
  }, [moveInStep, roomPhase, world.cozy.vibe]);

  return <section className="living-room-scene" aria-label="Живая комната Wego" data-vibe={world.cozy.vibe} data-room-phase={roomPhase} data-renderer={roomRenderer}>
    <div className="living-room-scene__canvas">
      {roomRenderer === "pixi" ? <Suspense fallback={<CompositeScene room={room} character={getWegoSceneAsset(style, stage, sceneState, world.equippedWegoItems.outfit)} fallback={fallback} sceneState={sceneState} characterLine={characterLine} world={world} onAction={runAction} onRoomInteraction={runRoomInteraction} onCozyAction={runCozyAction} />}><PixiRoomScene room={room} character={getWegoSceneAsset(style, stage, sceneState, world.equippedWegoItems.outfit)} characterLine={characterLine} world={world} onWorldAction={runAction} onRoomInteraction={runRoomInteraction} /></Suspense> : <CompositeScene room={room} character={getWegoSceneAsset(style, stage, sceneState, world.equippedWegoItems.outfit)} fallback={fallback} sceneState={sceneState} characterLine={characterLine} world={world} onAction={runAction} onRoomInteraction={runRoomInteraction} onCozyAction={runCozyAction} />}
    </div>
    {roomPhase === "showcase" && <RoomIntro onStart={runStartMoveIn} />}
    {roomPhase === "move-in" && <MoveInGuide step={moveInStep} onOpenRituals={() => openSheet("rituals")} onPlaceFurniture={runPlaceFirstFurniture} />}
    <span className="day-badge">День {daysAlive} · {character}</span>
    {welcomeBack && <div className="welcome-back" role="status">{welcomeBack}</div>}
    {roomPhase === "settled" && <div className="living-room-scene__legend">Нажми на предмет — комната ответит</div>}
    {feedback && <CozyToast feedback={feedback} onDismiss={() => setFeedback(null)} />}
  </section>;
}

function isBaseSpriteVisible(id: string, phase: WorldSnapshot["cozy"]["roomPhase"], buildLevel: number): boolean {
  if (phase === "showcase") return true;
  if (phase === "move-in") return false;
  const requiredLevel: Record<string, number> = { rug: 1, sofa: 2, bowl: 2, lamp: 3, table: 3, shelf: 4, plants: 4 };
  return buildLevel >= (requiredLevel[id] ?? 6);
}

function isRoomSpriteInstalled(id: string, world: WorldSnapshot): boolean {
  const roomSlot = id === "sofa" || id === "rug" || id === "lamp" || id === "table" || id === "shelf" || id === "plants" ? id : null;
  return Boolean(roomSlot && world.equippedRoomItems[roomSlot]);
}

function isCozyObjectVisible(object: (typeof cozyObjectSprites)[number], world: WorldSnapshot): boolean {
  const phase = world.cozy.roomPhase;
  if (object.phases && !object.phases.includes(phase)) return false;
  if (phase === "showcase") return true;
  if (phase === "move-in") return object.id === "gift-box";
  if (object.visibleFromBuildLevel && world.cozy.roomBuildLevel < object.visibleFromBuildLevel) return false;
  if (object.itemId && object.slot) return world.equippedRoomItems[object.slot] === object.itemId;
  return object.id === "console" && world.cozy.roomBuildLevel >= 2;
}

function CompositeScene({ room, character, fallback, sceneState, characterLine, world, onAction, onRoomInteraction, onCozyAction }: { room: "warm" | "morning"; character: string; fallback: string; sceneState: WegoSceneState; characterLine: string; world: WorldSnapshot; onAction: (type: WorldActionType, objectId?: RoomObjectId) => void; onRoomInteraction: (interaction: RoomInteraction) => void; onCozyAction: (action: CozyObjectAction) => void }) {
  const environment = world.environment;
  const roomAction = (id: string): RoomInteraction | null => {
    if (id === "lamp") return roomInteractionFor("lamp", environment);
    if (id === "table") return roomInteractionFor("table", environment);
    if (id === "plants") return roomInteractionFor("plant", environment);
    return null;
  };
  const labels: Record<string, string> = {
    lamp: environment.lamp === "on" ? "Выключить тёплый свет" : "Включить тёплый свет",
    table: environment.table === "tea-ready" ? "Выпить чай вдвоём" : "Налить чай для двоих",
    plants: "Полить растения",
  };
  return <div className={`living-room-scene__composite living-room-scene__composite--${sceneState} living-room-scene__composite--lamp-${environment.lamp} living-room-scene__composite--vibe-${world.cozy.vibe}`} data-scene="layered" data-vibe={world.cozy.vibe}>
    <img className="living-room-scene__background" src={roomBackgroundAsset(room)} alt="" onError={(event) => { if (event.currentTarget.dataset.fallback === "true") return; event.currentTarget.dataset.fallback = "true"; event.currentTarget.src = roomAsset(room); }} />
    <div className="cozy-vibe-layer" aria-hidden="true"><span /><span /><span /></div>
    <div className={`room-equipment-layer room-equipment-layer--${world.equippedRoomItems.wall ?? "base"}`} aria-hidden="true">
      {world.equippedRoomItems.wall === "rainy-window" && <span className="room-equipment-layer__rain" />}
      {world.equippedRoomItems.wall === "room-theme-autumn" && <span className="room-equipment-layer__leaves">✦　·　✧　·</span>}
      {world.equippedRoomItems.sofa === "soft-blanket" && <span className="room-equipment-layer__blanket">⌁</span>}
      {world.equippedRoomItems.table === "tea-set-berry" && environment.table === "empty" && <img className="room-equipment-layer__tea-decor" src={roomSpriteAsset("tea-set")} alt="" />}
      {world.equippedRoomItems.lamp === "lamp-paper" && <span className="room-equipment-layer__lamp-glow" />}
    </div>
    <div className="living-room-scene__props" aria-label="Предметы комнаты">
      <button type="button" className={`room-state-sprite room-state-sprite--window ${environment.curtains === "closed" ? "is-closed" : ""}`} aria-label={environment.curtains === "open" ? "Закрыть шторы" : "Открыть шторы"} onClick={() => onRoomInteraction(roomInteractionFor("window", environment))}>
        {environment.curtains === "closed" && <img src={roomSpriteAsset("curtains-closed")} alt="" draggable={false} />}
        <span className="room-sprite__hint" aria-hidden="true">{environment.curtains === "open" ? "☼" : "☾"}</span>
      </button>
      {roomSprites.map((sprite) => {
        if (!isBaseSpriteVisible(sprite.id, world.cozy.roomPhase, world.cozy.roomBuildLevel) && !isRoomSpriteInstalled(sprite.id, world)) return null;
        const object = sprite.objectId ? world.roomObjects[sprite.objectId] : undefined;
        const isRecentlyTouched = object?.lastInteractedAt ? Date.now() - Date.parse(object.lastInteractedAt) < 4500 : false;
        const className = `room-sprite ${sprite.className}${isRecentlyTouched ? " is-active" : ""}`;
        const image = <img src={sprite.src} alt="" draggable={false} />;
        const interaction = roomAction(sprite.id);
        const label = labels[sprite.id] ?? sprite.label;
        if (sprite.id === "table" && environment.table === "tea-ready") return <button key={sprite.id} type="button" className={`${className} room-sprite--table-ready`} style={{ zIndex: sprite.zIndex }} aria-label={label} onClick={() => onRoomInteraction(interaction!)}>{image}<img className="room-state-sprite__tea" src={roomSpriteAsset("tea-set")} alt="" draggable={false} /><span className="room-sprite__hint" aria-hidden="true">☕</span></button>;
        if (!sprite.interactive || !sprite.action) return <div key={sprite.id} className={className} style={{ zIndex: sprite.zIndex }}>{image}</div>;
        return <button key={sprite.id} type="button" className={className} style={{ zIndex: sprite.zIndex }} aria-label={label} onClick={() => interaction ? onRoomInteraction(interaction) : onAction(sprite.action!, sprite.objectId)}>{image}<span className="room-sprite__hint" aria-hidden="true">{sprite.id === "lamp" ? (environment.lamp === "on" ? "☼" : "☾") : sprite.id === "plants" ? "💧" : "✦"}</span></button>;
      })}
      {cozyObjectSprites.filter((object) => isCozyObjectVisible(object, world)).map((object) => <div key={object.id} className={`cozy-object cozy-object--${object.id}`} data-object-id={object.id} style={{ left: `${object.position.left}%`, top: `${object.position.top}%`, width: `${object.position.width}%`, zIndex: object.position.zIndex }}><img src={object.src} alt="" draggable={false} /><button type="button" className="scene-hotspot" aria-label={object.label} onClick={() => onCozyAction(object.action)}><span aria-hidden="true">✦</span></button></div>)}
      {world.cozy.roomPhase === "settled" && <MemoryWall compact />}
    </div>
    {world.cozy.roomPhase !== "showcase" && <div className={`living-room-scene__wego living-room-scene__wego--${world.equippedWegoItems.outfit} living-room-scene__wego--pose-${world.cozy.pose} ${world.equippedWegoItems.accessory ? "has-accessory" : ""} ${world.equippedWegoItems.emotion ? "has-emotion" : ""}`}>
      <div className="wego-speech" role="status">{characterLine}</div>
      {world.equippedWegoItems.accessory === "sunny-pin" && <span className="wego-cosmetic wego-cosmetic--pin" aria-hidden="true">✦</span>}
      {world.equippedWegoItems.outfit === "sunny-scarf" && <span className="wego-cosmetic wego-cosmetic--scarf" aria-hidden="true" />}
      {world.equippedWegoItems.outfit === "night-hoodie" && <span className="wego-cosmetic wego-cosmetic--hood" aria-hidden="true">☾</span>}
      {world.equippedWegoItems.emotion === "heart-bubble-effect" && <span className="wego-cosmetic wego-cosmetic--heart" aria-hidden="true">♡</span>}
      <img src={character} alt="Вего" className="living-room-scene__character" onError={(event) => { event.currentTarget.src = fallback; }} />
      <button type="button" className="wego-interaction-hitbox" aria-label="Погладить Вего" onClick={() => onAction("pet", "toy")}><span className="sr-only">Погладить Вего</span></button>
    </div>}
  </div>;
}
