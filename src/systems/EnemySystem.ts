import { fieldBounds } from "@/config";
import type { EventWriter } from "@/core/EventQueue";
import type { EnemyDestroyedEvent, EnemyHitEvent } from "@/core/WorldEvent";
import { Brick, Enemy, Player } from "@/entities";
import type { EnemySpawnDef } from "@/levels";

const HORIZONTAL_SPEED = 30;
const VERTICAL_SPEED = 18;

export class EnemySystem {
  private elapsedSeconds = 0;
  private nextSpawnIndex = 0;
  private spawns: readonly EnemySpawnDef[] = [];

  constructor(
    private readonly events: EventWriter<EnemyHitEvent | EnemyDestroyedEvent>,
  ) {}

  startLevel(spawns: readonly EnemySpawnDef[]): void {
    this.spawns = [...spawns].sort((a, b) => a.atSeconds - b.atSeconds);
    this.elapsedSeconds = 0;
    this.nextSpawnIndex = 0;
  }

  update(
    enemies: Enemy[],
    player: Player,
    bricks: readonly Brick[],
    dtSeconds: number,
  ): void {
    this.elapsedSeconds += dtSeconds;

    while (
      this.nextSpawnIndex < this.spawns.length &&
      this.spawns[this.nextSpawnIndex].atSeconds <= this.elapsedSeconds
    ) {
      enemies.push(this.createEnemy(this.spawns[this.nextSpawnIndex]));
      this.nextSpawnIndex++;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (
        !enemy.alive ||
        enemy.position.y - Enemy.HEIGHT / 2 > fieldBounds.bottom
      ) {
        enemies.splice(i, 1);
        continue;
      }

      this.moveHorizontally(enemy, bricks, dtSeconds);
      this.moveVertically(enemy, bricks, dtSeconds);

      if (this.overlapsPlayer(enemy, player)) {
        this.events.emit({ type: "enemyHit", enemy });
      }
    }
  }

  handleHit(enemy: Enemy): void {
    if (!enemy.alive) return;
    enemy.destroy();
    this.events.emit({ type: "enemyDestroyed", enemy });
  }

  private moveHorizontally(
    enemy: Enemy,
    bricks: readonly Brick[],
    dtSeconds: number,
  ): void {
    enemy.position.x += enemy.velocity.x * dtSeconds;

    const left = fieldBounds.left + Enemy.WIDTH / 2;
    const right = fieldBounds.right - Enemy.WIDTH / 2;
    if (enemy.position.x < left) {
      enemy.position.x = left;
      enemy.velocity.x = Math.abs(enemy.velocity.x);
    } else if (enemy.position.x > right) {
      enemy.position.x = right;
      enemy.velocity.x = -Math.abs(enemy.velocity.x);
    }

    for (const brick of bricks) {
      if (brick.destroyed || !this.overlapsBrick(enemy, brick)) continue;
      if (enemy.velocity.x > 0) {
        enemy.position.x = brick.position.x - Brick.WIDTH / 2 - Enemy.WIDTH / 2;
        enemy.velocity.x = -Math.abs(enemy.velocity.x);
      } else {
        enemy.position.x = brick.position.x + Brick.WIDTH / 2 + Enemy.WIDTH / 2;
        enemy.velocity.x = Math.abs(enemy.velocity.x);
      }
      break;
    }
  }

  private moveVertically(
    enemy: Enemy,
    bricks: readonly Brick[],
    dtSeconds: number,
  ): void {
    enemy.position.y += enemy.velocity.y * dtSeconds;

    for (const brick of bricks) {
      if (brick.destroyed || !this.overlapsBrick(enemy, brick)) continue;
      if (enemy.velocity.y > 0) {
        enemy.position.y =
          brick.position.y - Brick.HEIGHT / 2 - Enemy.HEIGHT / 2;
        enemy.velocity.y = -Math.abs(enemy.velocity.y);
      } else {
        enemy.position.y =
          brick.position.y + Brick.HEIGHT / 2 + Enemy.HEIGHT / 2;
        enemy.velocity.y = Math.abs(enemy.velocity.y);
      }
      break;
    }

    const top = fieldBounds.top + Enemy.HEIGHT / 2;
    if (enemy.position.y < top) {
      enemy.position.y = top;
      enemy.velocity.y = Math.abs(enemy.velocity.y);
    }
  }

  private overlapsBrick(enemy: Enemy, brick: Brick): boolean {
    return (
      Math.abs(enemy.position.x - brick.position.x) <
        (Enemy.WIDTH + Brick.WIDTH) / 2 &&
      Math.abs(enemy.position.y - brick.position.y) <
        (Enemy.HEIGHT + Brick.HEIGHT) / 2
    );
  }

  private createEnemy(spawn: EnemySpawnDef): Enemy {
    const fromLeft = spawn.side === "left";
    return new Enemy(
      spawn.kind,
      {
        x: fromLeft
          ? fieldBounds.left + Enemy.WIDTH / 2
          : fieldBounds.right - Enemy.WIDTH / 2,
        y: fieldBounds.top + Enemy.HEIGHT / 2,
      },
      {
        x: fromLeft ? HORIZONTAL_SPEED : -HORIZONTAL_SPEED,
        y: VERTICAL_SPEED,
      },
    );
  }

  private overlapsPlayer(enemy: Enemy, player: Player): boolean {
    return (
      Math.abs(enemy.position.x - player.position.x) <
        (Enemy.WIDTH + player.width) / 2 &&
      Math.abs(enemy.position.y - player.position.y) <
        (Enemy.HEIGHT + player.height) / 2
    );
  }
}
