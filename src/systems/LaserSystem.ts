import { Brick, Enemy, LaserShot, Player } from "@/entities";
import type { HitResolver } from "./HitResolver";

const SHOT_COOLDOWN_SECONDS = 0.2;
const MUZZLE_INSET = 9;

export class LaserSystem {
  private cooldownRemaining = 0;

  constructor(private readonly hits: HitResolver) {}

  update({
    shots,
    player,
    bricks,
    enemies,
    fireRequested,
    dtSeconds,
  }: {
    shots: LaserShot[];
    player: Player;
    bricks: readonly Brick[];
    enemies: readonly Enemy[];
    fireRequested: boolean;
    dtSeconds: number;
  }): void {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dtSeconds);

    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.advance(dtSeconds);

      if (shot.shouldDestroy()) {
        shots.splice(i, 1);
        continue;
      }

      const brick = this.findHitBrick(shot, bricks);
      const enemy = this.findHitEnemy(shot, enemies);
      if (enemy && (!brick || enemy.position.y > brick.position.y)) {
        shots.splice(i, 1);
        this.hits.resolveEnemyHit(enemy);
      } else if (brick) {
        shots.splice(i, 1);
        this.hits.resolveBrickHit(brick);
      }
    }

    if (
      fireRequested &&
      player.mode === "laser" &&
      this.cooldownRemaining === 0
    ) {
      this.fire(player, shots);
      this.cooldownRemaining = SHOT_COOLDOWN_SECONDS;
    }
  }

  reset(): void {
    this.cooldownRemaining = 0;
  }

  private fire(player: Player, shots: LaserShot[]): void {
    const offsetX = player.width / 2 - MUZZLE_INSET;
    const y = player.position.y - player.height / 2 - LaserShot.HEIGHT / 2;
    shots.push(new LaserShot({ x: player.position.x - offsetX, y }));
    shots.push(new LaserShot({ x: player.position.x + offsetX, y }));
  }

  private findHitBrick(
    shot: LaserShot,
    bricks: readonly Brick[],
  ): Brick | undefined {
    let closestBrick: Brick | undefined;

    for (const brick of bricks) {
      if (brick.destroyed) continue;

      const overlaps =
        shot.position.x + LaserShot.WIDTH / 2 >
          brick.position.x - Brick.WIDTH / 2 &&
        shot.position.x - LaserShot.WIDTH / 2 <
          brick.position.x + Brick.WIDTH / 2 &&
        shot.position.y + LaserShot.HEIGHT / 2 >
          brick.position.y - Brick.HEIGHT / 2 &&
        shot.position.y - LaserShot.HEIGHT / 2 <
          brick.position.y + Brick.HEIGHT / 2;

      if (
        overlaps &&
        (!closestBrick || brick.position.y > closestBrick.position.y)
      ) {
        closestBrick = brick;
      }
    }

    return closestBrick;
  }

  private findHitEnemy(
    shot: LaserShot,
    enemies: readonly Enemy[],
  ): Enemy | undefined {
    let closestEnemy: Enemy | undefined;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const overlaps =
        Math.abs(shot.position.x - enemy.position.x) <
          (LaserShot.WIDTH + Enemy.WIDTH) / 2 &&
        Math.abs(shot.position.y - enemy.position.y) <
          (LaserShot.HEIGHT + Enemy.HEIGHT) / 2;
      if (
        overlaps &&
        (!closestEnemy || enemy.position.y > closestEnemy.position.y)
      ) {
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }
}
