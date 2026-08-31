import { Assets, type Texture } from "pixi.js";

type TextureLoader<T> = (sources: string[]) => Promise<Record<string, T>>;

export async function loadPixiTextures<K extends string, T = Texture>(
  sources: Record<K, string>,
  load: TextureLoader<T> = ((urls) => Assets.load(urls)) as TextureLoader<T>,
): Promise<Record<K, T>> {
  const entries = Object.entries(sources) as Array<[K, string]>;
  const textures = await load(entries.map(([, source]) => source));

  return Object.fromEntries(entries.map(([key, source]) => [key, textures[source]])) as Record<K, T>;
}
