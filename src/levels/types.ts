import type { BrickKind, EnemyKind } from "@/entities";

export interface LevelDef {
  index: number;
  bricks: BrickDef[];
  enemySpawns?: EnemySpawnDef[];
}

export interface EnemySpawnDef {
  atSeconds: number;
  kind: EnemyKind;
  side: "left" | "right";
}

export interface BrickDef {
  row: number;
  column: number;
  kind: BrickKind;
  canDropCapsule?: boolean;
}
