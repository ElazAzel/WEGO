// Pixi's generated declaration graph is intentionally isolated from the core web typecheck.
// The renderer is opt-in; the default room uses the lightweight composite adapter.
// @ts-nocheck
import { Application, extend, useTick } from "@pixi/react";
import { Container, Sprite, Texture } from "pixi.js";
import { useMemo, useRef } from "react";
import { roomAsset } from "../../lib/asset";

extend({ Container, Sprite });

export default function PixiRoomScene({ room, character }: { room: "warm" | "morning"; character: string }) {
  const roomTexture = useMemo(() => Texture.from(roomAsset(room)), [room]);
  const characterTexture = useMemo(() => Texture.from(character), [character]);
  return <Application width={600} height={630} antialias backgroundAlpha={0} autoStart><pixiSprite texture={roomTexture} width={600} height={630} /><AnimatedWego texture={characterTexture} /></Application>;
}

function AnimatedWego({ texture }: { texture: Texture }) {
  const sprite = useRef<Sprite | null>(null);
  useTick((ticker) => {
    if (!sprite.current) return;
    const seconds = ticker.lastTime / 1000;
    sprite.current.y = 472 + Math.sin(seconds * 2) * 4;
    sprite.current.rotation = Math.sin(seconds * 1.1) * 0.015;
  });
  return <pixiSprite ref={sprite} texture={texture} anchor={0.5} x={300} y={472} width={202} height={202} />;
}
