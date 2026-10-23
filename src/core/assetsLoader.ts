import { Assets, Texture } from "pixi.js";
import { POWER_UP_KINDS, type PowerUpKind } from "@/entities";

const gameAssetPaths = {
  player: "/player/vaus.png",
  playerExpanded: "/player/vaus-expanded.png",
  ball: "ball/ball.png",
  field1: "/fields/field-01.png",
  brickSilver: "bricks/silver-01.png",
  brickGold: "bricks/gold-01.png",
} as const;

export type GameAssets = Readonly<
  Record<keyof typeof gameAssetPaths, Texture>
> & {
  readonly powerUps: Readonly<Record<PowerUpKind, Texture[]>>;
};

const POWER_UP_FRAMES = ["01", "02", "03", "04", "05", "06"];

async function loadTexture(path: string): Promise<Texture> {
  const texture = await Assets.load<Texture>(path);
  texture.source.scaleMode = "nearest";
  return texture;
}

export async function loadGameAssets(): Promise<GameAssets> {
  const [entries, powerUpEntries] = await Promise.all([
    Promise.all(
      Object.entries(gameAssetPaths).map(async ([key, path]) => {
        return [key, await loadTexture(path)] as const;
      }),
    ),
    Promise.all(
      POWER_UP_KINDS.map(async (kind) => {
        const frames = await Promise.all(
          POWER_UP_FRAMES.map((frame) =>
            loadTexture(`/powerups/${kind}-${frame}.png`),
          ),
        );
        return [kind, frames] as const;
      }),
    ),
  ]);

  return {
    ...Object.fromEntries(entries),
    powerUps: Object.fromEntries(powerUpEntries),
  } as GameAssets;
}
