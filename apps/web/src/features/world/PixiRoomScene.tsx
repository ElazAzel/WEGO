import { Application, extend, useTick } from "@pixi/react";
import type { RoomInteraction, RoomObjectId, WorldSnapshot } from "@wego/domain";
import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { roomBackgroundAsset } from "../../lib/asset";
import type { WorldActionType } from "../../store/use-app-store";
import { roomSpriteAsset } from "./room-sprite-manifest";
import { loadPixiTextures } from "./pixi-assets";
import {
  SceneDirector,
  projectEquippedEntities,
  roomEntityManifest,
  sceneCommandForTarget,
  visibleRoomEntityIds,
  wegoVisualFrame,
  type SceneEntityId,
  type ScenePlan,
  type WegoRuntimeState,
} from "./game-scene";

extend({ Container, Graphics, Sprite });

interface PixiRoomSceneProps {
  room: "warm" | "morning";
  character: string;
  characterLine: string;
  world: WorldSnapshot;
  onWorldAction: (type: WorldActionType, objectId?: RoomObjectId) => void;
  onRoomInteraction: (interaction: RoomInteraction) => void;
}

const home = { x: 300, y: 472 };

export default function PixiRoomScene({ room, character, characterLine, world, onWorldAction, onRoomInteraction }: PixiRoomSceneProps) {
  const director = useRef(new SceneDirector(roomEntityManifest));
  const timers = useRef<number[]>([]);
  const [wegoState, setWegoState] = useState<WegoRuntimeState>("idle");
  const [wegoTarget, setWegoTarget] = useState(home);
  const [textures, setTextures] = useState<Record<"background" | "rug" | "sofa" | "lamp" | "table" | "curtains" | "tea" | "wego", Texture> | null>(null);
  const visibleIds = useMemo(() => new Set(visibleRoomEntityIds(world)), [world]);
  const projections = useMemo(() => projectEquippedEntities(world), [world]);
  const textureSources = useMemo(() => ({
    background: roomBackgroundAsset(room),
    rug: roomSpriteAsset("rug"),
    sofa: roomSpriteAsset("sofa"),
    lamp: roomSpriteAsset("lamp"),
    table: roomSpriteAsset("table"),
    curtains: roomSpriteAsset("curtains-closed"),
    tea: roomSpriteAsset("tea-set"),
    wego: character,
  }), [character, room]);

  useEffect(() => {
    let active = true;
    setTextures(null);
    void loadPixiTextures(textureSources).then((loaded) => {
      if (active) setTextures(loaded);
    });
    return () => { active = false; };
  }, [textureSources]);

  const executeCommand = useCallback((targetId: SceneEntityId) => {
    const command = sceneCommandForTarget(targetId, world);
    if (!command) return;
    if (command.kind === "room") onRoomInteraction(command.interaction);
    else onWorldAction(command.action, command.objectId);
  }, [onRoomInteraction, onWorldAction, world]);

  const runPlan = useCallback((plan: ScenePlan) => {
    let elapsed = 0;
    for (const phase of plan.phases) {
      const timer = window.setTimeout(() => {
        if (phase.type === "goto") {
          setWegoTarget(plan.targetAnchor);
          setWegoState(phase.state);
        } else if (phase.type === "return") {
          setWegoTarget(home);
          setWegoState(phase.state);
        } else if (phase.type === "effect") {
          executeCommand(plan.targetId);
        } else {
          setWegoState(phase.state);
        }
      }, elapsed);
      timers.current.push(timer);
      elapsed += phase.durationMs;
    }
    const completion = window.setTimeout(() => {
      setWegoState("idle");
      setWegoTarget(home);
      director.current.complete(plan.id);
    }, elapsed);
    timers.current.push(completion);
  }, [executeCommand]);

  const interact = useCallback((targetId: SceneEntityId) => {
    const plan = director.current.begin({ id: globalThis.crypto?.randomUUID?.() ?? `scene-${Date.now()}`, targetId, kind: targetId === "wego" ? "pet" : "interact" }, world);
    if (plan) runPlan(plan);
  }, [runPlan, world]);

  useEffect(() => () => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  const showTea = world.environment.table === "tea-ready" || projections.some((projection) => projection.hostId === "table");
  const showBlanket = projections.some((projection) => projection.hostId === "sofa");
  const paperLamp = projections.some((projection) => projection.hostId === "lamp");

  if (!textures) {
    return <div className="pixi-room-runtime pixi-room-runtime--loading" role="status" aria-label="Загружаем комнату"><span>Собираем комнату…</span></div>;
  }

  return <div className="pixi-room-runtime" data-wego-state={wegoState}>
    <Application width={600} height={630} antialias backgroundAlpha={0} autoStart resolution={Math.min(globalThis.devicePixelRatio || 1, 2)}>
      <pixiContainer sortableChildren>
        <pixiSprite texture={textures.background} width={600} height={630} zIndex={0} />
        {world.environment.lamp === "off" && <RoomShade />}
        {visibleIds.has("rug") && <InteractiveSprite id="rug" texture={textures.rug} onInteract={interact} />}
        {visibleIds.has("window") && <WindowEntity closed={world.environment.curtains === "closed"} texture={textures.curtains} onInteract={() => interact("window")} />}
        {visibleIds.has("sofa") && <InteractiveSprite id="sofa" texture={textures.sofa} onInteract={interact} />}
        {showBlanket && visibleIds.has("sofa") && <BlanketProjection />}
        {visibleIds.has("lamp") && <InteractiveSprite id="lamp" texture={textures.lamp} onInteract={interact} />}
        {visibleIds.has("lamp") && world.environment.lamp === "on" && <LampGlow paper={paperLamp} />}
        {visibleIds.has("table") && <InteractiveSprite id="table" texture={textures.table} onInteract={interact} />}
        {visibleIds.has("table") && showTea && <pixiSprite texture={textures.tea} x={418} y={382} width={105} height={84} zIndex={36} eventMode="none" />}
        {visibleIds.has("wego") && <AnimatedWego texture={textures.wego} state={wegoState} target={wegoTarget} outfit={world.equippedWegoItems.outfit} accessory={world.equippedWegoItems.accessory} emotion={world.equippedWegoItems.emotion} onInteract={() => interact("wego")} />}
      </pixiContainer>
    </Application>
    <div className="pixi-room-runtime__speech" role="status">{characterLine}</div>
    <div className="pixi-room-runtime__controls" aria-label="Интерактивные предметы комнаты">
      {visibleIds.has("wego") && <MirrorButton id="wego" label="Погладить Вего" onInteract={interact} />}
      {visibleIds.has("lamp") && <MirrorButton id="lamp" label={world.environment.lamp === "on" ? "Выключить тёплый свет" : "Включить тёплый свет"} onInteract={interact} />}
      {visibleIds.has("window") && <MirrorButton id="window" label={world.environment.curtains === "open" ? "Закрыть шторы" : "Открыть шторы"} onInteract={interact} />}
      {visibleIds.has("table") && <MirrorButton id="table" label={world.environment.table === "tea-ready" ? "Выпить чай вдвоём" : "Налить чай для двоих"} onInteract={interact} />}
      {visibleIds.has("sofa") && <MirrorButton id="sofa" label="Поиграть с Вего на диване" onInteract={interact} />}
    </div>
  </div>;
}

function InteractiveSprite({ id, texture, onInteract }: { id: SceneEntityId; texture: Texture; onInteract: (id: SceneEntityId) => void }) {
  const entity = roomEntityManifest.find((item) => item.id === id)!;
  return <pixiSprite texture={texture} x={entity.position.x} y={entity.position.y} width={entity.size.width} height={entity.size.height} zIndex={entity.zIndex} eventMode={entity.interactive ? "static" : "none"} cursor={entity.interactive ? "pointer" : "default"} onPointerTap={() => entity.interactive && onInteract(id)} />;
}

function WindowEntity({ closed, texture, onInteract }: { closed: boolean; texture: Texture; onInteract: () => void }) {
  return <pixiContainer zIndex={21} eventMode="static" cursor="pointer" onPointerTap={onInteract}>
    <pixiGraphics draw={(graphics) => { graphics.clear(); graphics.rect(62, 126, 214, 272); graphics.fill({ color: 0xffffff, alpha: 0.001 }); }} />
    {closed && <pixiSprite texture={texture} x={48} y={105} width={242} height={312} />}
  </pixiContainer>;
}

function AnimatedWego({ texture, state, target, outfit, accessory, emotion, onInteract }: { texture: Texture; state: WegoRuntimeState; target: { x: number; y: number }; outfit: string; accessory: string | null; emotion: string | null; onInteract: () => void }) {
  const sprite = useRef<Container | null>(null);
  useTick((ticker) => {
    const current = sprite.current;
    if (!current) return;
    const smoothing = Math.min(1, ticker.deltaTime * 0.09);
    current.x += (target.x - current.x) * smoothing;
    current.y += (target.y - current.y) * smoothing;
    const seconds = ticker.lastTime / 1000;
    const breathing = state === "walking" ? Math.sin(seconds * 9) * 3 : Math.sin(seconds * 2.2) * 2.5;
    current.y += breathing * 0.08;
    const frame = wegoVisualFrame(state, seconds);
    current.rotation = frame.rotation;
    current.scale.set(frame.width / 176);
  });
  return <pixiContainer ref={sprite} x={home.x} y={home.y} zIndex={40} eventMode="static" cursor="pointer" onPointerTap={onInteract}>
    {outfit === "night-hoodie" && <pixiGraphics eventMode="none" draw={(graphics) => { graphics.clear(); graphics.circle(0, -6, 77); graphics.stroke({ color: 0x564276, width: 18, alpha: 0.92 }); }} />}
    <pixiSprite texture={texture} anchor={0.5} x={0} y={0} width={176} height={176} />
    {outfit === "sunny-scarf" && <pixiGraphics eventMode="none" draw={(graphics) => { graphics.clear(); graphics.roundRect(-53, 18, 106, 20, 10); graphics.fill({ color: 0xff8f75, alpha: 0.96 }); graphics.roundRect(28, 30, 19, 49, 9); graphics.fill({ color: 0xffb05e, alpha: 0.96 }); }} />}
    {accessory === "sunny-pin" && <pixiGraphics eventMode="none" draw={(graphics) => { graphics.clear(); graphics.circle(47, 5, 12); graphics.fill({ color: 0xffd45c, alpha: 1 }); graphics.circle(47, 5, 4); graphics.fill({ color: 0xfff6c2, alpha: 1 }); }} />}
    {emotion === "heart-bubble-effect" && <HeartBubbles />}
  </pixiContainer>;
}

function HeartBubbles() {
  const graphics = useRef<Graphics | null>(null);
  useTick((ticker) => {
    if (!graphics.current) return;
    graphics.current.y = Math.sin(ticker.lastTime / 480) * 5;
    graphics.current.alpha = 0.74 + Math.sin(ticker.lastTime / 350) * 0.18;
  });
  return <pixiGraphics ref={graphics} eventMode="none" draw={(value) => { value.clear(); value.circle(-67, -55, 9); value.circle(68, -73, 7); value.circle(78, -40, 4); value.fill({ color: 0xff7180, alpha: 0.85 }); }} />;
}

function LampGlow({ paper }: { paper: boolean }) {
  const graphics = useRef<Graphics | null>(null);
  useTick((ticker) => {
    if (!graphics.current) return;
    graphics.current.alpha = 0.78 + Math.sin(ticker.lastTime / 430) * 0.1;
  });
  return <pixiGraphics ref={graphics} zIndex={31} eventMode="none" draw={(value) => { value.clear(); value.circle(438, 332, paper ? 74 : 58); value.fill({ color: paper ? 0xffd9a8 : 0xffbf74, alpha: paper ? 0.22 : 0.16 }); }} />;
}

function RoomShade() {
  return <pixiGraphics zIndex={5} eventMode="none" draw={(graphics) => { graphics.clear(); graphics.rect(0, 0, 600, 630); graphics.fill({ color: 0x3b3158, alpha: 0.26 }); }} />;
}

function BlanketProjection() {
  return <pixiGraphics zIndex={33} eventMode="none" draw={(graphics) => { graphics.clear(); graphics.roundRect(112, 402, 142, 72, 28); graphics.fill({ color: 0xf8d5c6, alpha: 0.88 }); graphics.stroke({ color: 0xfff0e7, width: 5, alpha: 0.9 }); }} />;
}

function MirrorButton({ id, label, onInteract }: { id: SceneEntityId; label: string; onInteract: (id: SceneEntityId) => void }) {
  return <button type="button" className={`pixi-room-runtime__mirror pixi-room-runtime__mirror--${id}`} aria-label={label} onClick={() => onInteract(id)}><span aria-hidden="true">✦</span></button>;
}
