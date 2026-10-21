import { Assets, Texture } from "pixi.js";

const gameAssetPaths = {
  player: "/player/vaus.png",
  ball: "ball/ball.png",
  field1: "/fields/field-01.png",
  brickSilver: "bricks/silver-01.png",
  brickGold: "bricks/gold-01.png",
} as const;

export type GameAssets = Readonly<Record<keyof typeof gameAssetPaths, Texture>>;

export async function loadGameAssets(): Promise<GameAssets> {
  const entries = await Promise.all(
    Object.entries(gameAssetPaths).map(async ([key, path]) => {
      const texture = await Assets.load<Texture>(path);
      texture.source.scaleMode = "nearest";

      return [key, texture] as const;
    }),
  );

  return Object.fromEntries(entries) as GameAssets;
}
