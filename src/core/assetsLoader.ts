import { Assets, Texture } from "pixi.js";
import {
  ENEMY_KINDS,
  POWER_UP_KINDS,
  type EnemyKind,
  type PowerUpKind,
} from "@/entities";

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
    readonly playerSpawnFrames: Texture[];
    readonly playerDestroyFrames: Texture[];
    readonly powerUps: Readonly<Record<PowerUpKind, Texture[]>>;
    readonly brickHitFrames: Readonly<Record<"silver" | "gold", Texture[]>>;
    readonly enemyFrames: Readonly<Record<EnemyKind, Texture[]>>;
    readonly enemyExplosionFrames: Texture[];
  };

const ANIMATION_FRAMES = ["01", "02", "03", "04", "05", "06"];
const PLAYER_DESTROY_FRAMES = [...ANIMATION_FRAMES, "07"];

async function loadTexture(path: string): Promise<Texture> {
  const texture = await Assets.load<Texture>(path);
  texture.source.scaleMode = "nearest";
  return texture;
}

async function loadEnemyAnimations(): Promise<{
  enemyFrames: Record<EnemyKind, Texture[]>;
  enemyExplosionFrames: Texture[];
}> {
  const sheet = new Image();
  sheet.src = "/enemies/sheet.png";
  await sheet.decode();

  const frameCounts: Record<EnemyKind, number> = {
    blueShip: 8,
    yellowShip: 7,
    blueOrb: 6,
    redOrb: 8,
  };

  const createFrames = (row: number, count: number): Texture[] =>
    Array.from({ length: count }, (_, column) => {
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not prepare enemy sprite");

      context.drawImage(sheet, column * 16, row * 16, 16, 16, 0, 0, 16, 16);
      const image = context.getImageData(0, 0, 16, 16);
      for (let i = 0; i < image.data.length; i += 4) {
        if (
          image.data[i] <= 1 &&
          image.data[i + 1] <= 1 &&
          image.data[i + 2] <= 1
        ) {
          image.data[i + 3] = 0;
        }
      }
      context.putImageData(image, 0, 0);
      const texture = Texture.from(canvas);
      texture.source.scaleMode = "nearest";
      return texture;
    });

  return {
    enemyFrames: Object.fromEntries(
      ENEMY_KINDS.map((kind, row) => [
        kind,
        createFrames(row, frameCounts[kind]),
      ]),
    ) as Record<EnemyKind, Texture[]>,
    enemyExplosionFrames: createFrames(4, 4),
  };
}

export async function loadGameAssets(): Promise<GameAssets> {
  const [
    entries,
    animationEntries,
    powerUpEntries,
    brickHitEntries,
    enemyAnimations,
    playerSpawnFrames,
    playerDestroyFrames,
  ] = await Promise.all([
    Promise.all(
      Object.entries(gameAssetPaths).map(async ([key, path]) => {
        return [key, await loadTexture(path)] as const;
      }),
    ),
    Promise.all(
      Object.entries(playerAnimationPaths).map(async ([key, path]) => {
        const frames = await Promise.all(
          ANIMATION_FRAMES.map((frame) => loadTexture(`${path}-${frame}.png`)),
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
          ANIMATION_FRAMES.map((frame) => loadTexture(`${path}-${frame}.png`)),
        );
        return [kind, frames] as const;
      }),
    ),
    loadEnemyAnimations(),
    Promise.all(
      ANIMATION_FRAMES.slice(0, 5).map((frame) =>
        loadTexture(`/player/spawn-${frame}.png`),
      ),
    ),
    Promise.all(
      PLAYER_DESTROY_FRAMES.map((frame) =>
        loadTexture(`/player/destroy-${frame}.png`),
      ),
    ),
  ]);

  return {
    ...Object.fromEntries(entries),
    ...Object.fromEntries(animationEntries),
    powerUps: Object.fromEntries(powerUpEntries),
    brickHitFrames: Object.fromEntries(brickHitEntries),
    enemyFrames: enemyAnimations.enemyFrames,
    enemyExplosionFrames: enemyAnimations.enemyExplosionFrames,
    playerSpawnFrames,
    playerDestroyFrames,
  } as GameAssets;
}
