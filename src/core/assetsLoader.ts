import { Assets, Texture } from "pixi.js";
import { playerAnimationConfig } from "@/config";
import type { EnemyKind, PowerUpKind } from "@/entities";

type FrameSet = { basePath: string; count: number };

const gamePaths = {
  laserShot: "/player/laser-shot.png",
  ball: "/ball/ball.png",
} as const;

const fieldPaths = {
  background: "/fields/backgrounds/blue-diagonal.png",
  cornerLeft: "/fields/frame/corner-left.png",
  cornerRight: "/fields/frame/corner-right.png",
  topRail: "/fields/frame/top-rail.png",
  sideLeft: "/fields/frame/side-left.png",
  sideRight: "/fields/frame/side-right.png",
  closedExit: "/fields/frame/exit-closed.png",
} as const;

const fieldFramePaths = {
  exitFrames: { basePath: "/fields/exit-frames/exit", count: 3 },
  gateFrames: { basePath: "/fields/gate-frames/gate", count: 3 },
} as const;

const playerAnimationPaths = {
  normalLights: {
    basePath: "/player/normal-lights",
    count: playerAnimationConfig.normalLights.frameCount,
  },
  expandedLights: {
    basePath: "/player/expanded-lights",
    count: playerAnimationConfig.expandedLights.frameCount,
  },
  laserTransform: {
    basePath: "/player/laser-transform",
    count: playerAnimationConfig.laserTransform.frameCount,
  },
  laserLights: {
    basePath: "/player/laser-lights",
    count: playerAnimationConfig.laserLights.frameCount,
  },
} as const;

const playerPhasePaths = {
  spawn: {
    basePath: "/player/spawn",
    count: playerAnimationConfig.spawn.frameCount,
  },
  destroy: {
    basePath: "/player/destroy",
    count: playerAnimationConfig.destroy.frameCount,
  },
} as const;

const powerUpPaths = {
  laser: "/powerups/laser",
  expand: "/powerups/expand",
  catch: "/powerups/catch",
  disrupt: "/powerups/disrupt",
  slow: "/powerups/slow",
  break: "/powerups/break",
  player: "/powerups/player",
} as const satisfies Record<PowerUpKind, string>;

const brickHitPaths = {
  silver: "/bricks/silver-hit",
  gold: "/bricks/gold-hit",
} as const satisfies Record<"silver" | "gold", string>;

const enemyPaths = {
  blueShip: { basePath: "/enemies/blue-ship", count: 8 },
  yellowShip: { basePath: "/enemies/yellow-ship", count: 7 },
  blueOrb: { basePath: "/enemies/blue-orb", count: 6 },
  redOrb: { basePath: "/enemies/red-orb", count: 8 },
} as const satisfies Record<EnemyKind, FrameSet>;

const enemyExplosion = { basePath: "/enemies/explosion", count: 4 };
const ANIMATION_FRAME_COUNT = 6;

export type GameAssets = Readonly<Record<keyof typeof gamePaths, Texture>> &
  Readonly<Record<keyof typeof playerAnimationPaths, Texture[]>> & {
    readonly field: Readonly<
      Record<keyof typeof fieldPaths, Texture> &
        Record<keyof typeof fieldFramePaths, Texture[]>
    >;
    readonly playerSpawnFrames: Texture[];
    readonly playerDestroyFrames: Texture[];
    readonly powerUps: Readonly<Record<PowerUpKind, Texture[]>>;
    readonly brickHitFrames: Readonly<
      Record<keyof typeof brickHitPaths, Texture[]>
    >;
    readonly enemyFrames: Readonly<Record<EnemyKind, Texture[]>>;
    readonly enemyExplosionFrames: Texture[];
  };

async function loadTexture(path: string): Promise<Texture> {
  const texture = await Assets.load<Texture>(path);
  if (!(texture instanceof Texture)) {
    throw new Error(`Could not load texture: ${path}`);
  }
  texture.source.scaleMode = "nearest";
  return texture;
}

function loadFrames({ basePath, count }: FrameSet): Promise<Texture[]> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Invalid frame count for ${basePath}: ${count}`);
  }
  return Promise.all(
    Array.from({ length: count }, (_, index) =>
      loadTexture(`${basePath}-${String(index + 1).padStart(2, "0")}.png`),
    ),
  );
}

async function loadCatalog<Catalog extends Record<string, unknown>, Value>(
  catalog: Catalog,
  load: (entry: Catalog[keyof Catalog]) => Promise<Value>,
): Promise<{ [Key in keyof Catalog]: Value }> {
  const entries = await Promise.all(
    (Object.keys(catalog) as (keyof Catalog)[]).map(
      async (key) => [key, await load(catalog[key])] as const,
    ),
  );
  // Every key comes from catalog, and Promise.all requires every load to succeed.
  return Object.fromEntries(entries) as { [Key in keyof Catalog]: Value };
}

export class AssetLoader {
  async load(): Promise<GameAssets> {
    const [
      game,
      fieldTextures,
      fieldFrames,
      playerAnimations,
      playerPhases,
      powerUps,
      brickHitFrames,
      enemyFrames,
      enemyExplosionFrames,
    ] = await Promise.all([
      loadCatalog(gamePaths, loadTexture),
      loadCatalog(fieldPaths, loadTexture),
      loadCatalog(fieldFramePaths, loadFrames),
      loadCatalog(playerAnimationPaths, loadFrames),
      loadCatalog(playerPhasePaths, loadFrames),
      loadCatalog(powerUpPaths, (basePath) =>
        loadFrames({ basePath, count: ANIMATION_FRAME_COUNT }),
      ),
      loadCatalog(brickHitPaths, (basePath) =>
        loadFrames({ basePath, count: ANIMATION_FRAME_COUNT }),
      ),
      loadCatalog(enemyPaths, loadFrames),
      loadFrames(enemyExplosion),
    ]);

    return {
      ...game,
      field: { ...fieldTextures, ...fieldFrames },
      ...playerAnimations,
      playerSpawnFrames: playerPhases.spawn,
      playerDestroyFrames: playerPhases.destroy,
      powerUps,
      brickHitFrames,
      enemyFrames,
      enemyExplosionFrames,
    } satisfies GameAssets;
  }
}
