import type { Brick, Enemy } from "@/entities";

export interface HitResolver {
  resolveBrickHit(brick: Brick): void;
  resolveEnemyHit(enemy: Enemy): void;
}
