import type { BrickKind } from "@/entities";
import { ROUND_LAYOUTS } from "./layouts";
import type { BrickDef, EnemySpawnDef, LevelDef } from "./types";

// Symbols follow the color legend in public/arkanoid.png.
const BRICK_KINDS: Record<string, BrickKind | undefined> = {
  W: "white",
  O: "orange",
  C: "light-blue",
  G: "green",
  R: "red",
  B: "blue",
  P: "pink",
  Y: "yellow",
  S: "silver",
  X: "gold",
};

const ENEMY_SPAWNS: Record<number, EnemySpawnDef[] | undefined> = {
  1: [
    { atSeconds: 2, kind: "blueShip", side: "left" },
    { atSeconds: 6, kind: "yellowShip", side: "right" },
    { atSeconds: 10, kind: "blueOrb", side: "left" },
    { atSeconds: 14, kind: "redOrb", side: "right" },
  ],
  2: [{ atSeconds: 2, kind: "redOrb", side: "left" }],
};

function bricksFromLayout(
  layout: readonly string[],
  levelIndex: number,
): BrickDef[] {
  const bricks: BrickDef[] = [];
  let breakableCount = 0;

  layout.forEach((line, row) => {
    if (line.length !== 11) {
      throw new Error(`Round ${levelIndex}, row ${row} must have 11 columns`);
    }

    for (const [column, symbol] of [...line].entries()) {
      if (symbol === ".") continue;
      const kind = BRICK_KINDS[symbol];
      if (!kind) {
        throw new Error(`Unknown brick ${symbol} in round ${levelIndex}`);
      }

      const canDropCapsule = kind !== "gold" && breakableCount++ % 12 === 5;
      bricks.push({ row, column, kind, canDropCapsule });
    }
  });

  return bricks;
}

export const levels: readonly LevelDef[] = ROUND_LAYOUTS.map(
  (layout, index) => {
    const levelIndex = index + 1;
    return {
      index: levelIndex,
      bricks: bricksFromLayout(layout, levelIndex),
      enemySpawns: ENEMY_SPAWNS[levelIndex],
    };
  },
);
