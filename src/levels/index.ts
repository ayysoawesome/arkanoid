export type { LevelDef, BrickDef, EnemySpawnDef } from "./types";

import { level1, level2 } from "./levels";
import { LevelDef } from "./types";
export const levels: readonly LevelDef[] = [level1, level2];
