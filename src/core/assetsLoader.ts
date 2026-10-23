import { Assets, Texture } from "pixi.js";
import { POWER_UP_KINDS, type PowerUpKind } from "@/entities";

const gameAssetPaths = {
  laserShot: "/player/laser-shot.png",
  ball: "ball/ball.png",
  field1: "/fields/field-01.png",
  exit: "/fields/exit.png",
} as const;

const playerAnimationPaths = {
  normalLights: "/player/normal-lights",
  expandedLights: "/player/expanded-lights",
  laserTransform: "/player/laser-transform",
  laserLights: "/player/laser-lights",
} as const;

const brickHitPaths = {
  silver: "/bricks/silver-hit",
  gold: "/bricks/gold-hit",
} as const;

export type GameAssets = Readonly<
  Record<keyof typeof gameAssetPaths, Texture>
> &
  Readonly<Record<keyof typeof playerAnimationPaths, Texture[]>> & {
    readonly powerUps: Readonly<Record<PowerUpKind, Texture[]>>;
    readonly brickHitFrames: Readonly<Record<"silver" | "gold", Texture[]>>;
  };

const ANIMATION_FRAMES = ["01", "02", "03", "04", "05", "06"];

async function loadTexture(path: string): Promise<Texture> {
  const texture = await Assets.load<Texture>(path);
  texture.source.scaleMode = "nearest";
  return texture;
}

export async function loadGameAssets(): Promise<GameAssets> {
  const [entries, animationEntries, powerUpEntries, brickHitEntries] =
    await Promise.all([
      Promise.all(
        Object.entries(gameAssetPaths).map(async ([key, path]) => {
          return [key, await loadTexture(path)] as const;
        }),
      ),
      Promise.all(
        Object.entries(playerAnimationPaths).map(async ([key, path]) => {
          const frames = await Promise.all(
            ANIMATION_FRAMES.map((frame) =>
              loadTexture(`${path}-${frame}.png`),
            ),
          );
          return [key, frames] as const;
        }),
      ),
      Promise.all(
        POWER_UP_KINDS.map(async (kind) => {
          const frames = await Promise.all(
            ANIMATION_FRAMES.map((frame) =>
              loadTexture(`/powerups/${kind}-${frame}.png`),
            ),
          );
          return [kind, frames] as const;
        }),
      ),
      Promise.all(
        Object.entries(brickHitPaths).map(async ([kind, path]) => {
          const frames = await Promise.all(
            ANIMATION_FRAMES.map((frame) =>
              loadTexture(`${path}-${frame}.png`),
            ),
          );
          return [kind, frames] as const;
        }),
      ),
    ]);

  return {
    ...Object.fromEntries(entries),
    ...Object.fromEntries(animationEntries),
    powerUps: Object.fromEntries(powerUpEntries),
    brickHitFrames: Object.fromEntries(brickHitEntries),
  } as GameAssets;
}
