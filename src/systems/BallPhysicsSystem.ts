import { Ball, Brick, Enemy, Player } from "@/entities";
import { fieldBounds } from "@/config";
import type { EventWriter } from "@/core/EventQueue";
import type { BrickHitEvent, EnemyHitEvent } from "@/core/WorldEvent";

const MAX_BOUNCE_ANGLE = (70 * Math.PI) / 180;
const LAUNCH_ANGLE = (20 * Math.PI) / 180;

export class BallPhysicsSystem {
  constructor(
    private readonly events: EventWriter<BrickHitEvent | EnemyHitEvent>,
  ) {}

  update({
    ball,
    dtSeconds,
    player,
    launchRequested,
    bricks,
    enemies,
  }: {
    ball: Ball;
    player: Player;
    dtSeconds: number;
    launchRequested: boolean;
    bricks: readonly Brick[];
    enemies: readonly Enemy[];
  }): void {
    if (!ball.alive) return;

    if (ball.attached) {
      this.updateAttachedBall(ball, player, launchRequested);
      return;
    }

    const previousX = ball.position.x;
    const previousY = ball.position.y;

    ball.position.x += ball.velocity.x * dtSeconds;
    ball.position.y += ball.velocity.y * dtSeconds;

    this.resolveWallCollisions(ball);
    const hitBrick = this.resolveBrickCollision(
      ball,
      bricks,
      previousX,
      previousY,
    );
    if (!hitBrick) {
      this.resolveEnemyCollision(ball, enemies, previousX, previousY);
    }
    this.resolvePlayerCollision(ball, player, previousY);

    if (ball.position.y - ball.radius >= fieldBounds.bottom) {
      ball.alive = false;
    }
  }

  private resolvePlayerCollision(ball: Ball, player: Player, prevY: number) {
    if (ball.velocity.y <= 0) return;
    const playerTop = player.position.y - player.height / 2;
    const playerLeft = player.position.x - player.width / 2;
    const playerRight = player.position.x + player.width / 2;
    const crossedTop =
      prevY + ball.radius <= playerTop &&
      ball.position.y + ball.radius >= playerTop;

    const overlapsHorizontally =
      ball.position.x + ball.radius >= playerLeft &&
      ball.position.x - ball.radius <= playerRight;

    if (!crossedTop || !overlapsHorizontally) return;

    if (player.mode === "catch") {
      const maxOffsetX = player.width / 2 - ball.radius;
      const offsetX = Math.max(
        -maxOffsetX,
        Math.min(maxOffsetX, ball.position.x - player.position.x),
      );
      ball.position.x = player.position.x + offsetX;
      ball.position.y = playerTop - ball.radius;
      ball.attach(offsetX);
      return;
    }

    ball.position.y = playerTop - ball.radius;
    this.setBallDirectionFromPlayerOffset(
      ball,
      player,
      ball.position.x - player.position.x,
    );
    ball.registerBounce();
  }

  private resolveBrickCollision(
    ball: Ball,
    bricks: readonly Brick[],
    previousX: number,
    previousY: number,
  ): boolean {
    for (const brick of bricks) {
      if (brick.destroyed) continue;

      const left = brick.position.x - Brick.WIDTH / 2;
      const right = brick.position.x + Brick.WIDTH / 2;
      const top = brick.position.y - Brick.HEIGHT / 2;
      const bottom = brick.position.y + Brick.HEIGHT / 2;

      const closestX = Math.max(left, Math.min(ball.position.x, right));
      const closestY = Math.max(top, Math.min(ball.position.y, bottom));
      const offsetX = ball.position.x - closestX;
      const offsetY = ball.position.y - closestY;

      if (offsetX * offsetX + offsetY * offsetY >= ball.radius * ball.radius) {
        continue;
      }

      this.events.emit({ type: "brickHit", brick });

      ball.position.x = previousX;
      ball.position.y = previousY;

      if (offsetX !== 0) ball.velocity.x *= -1;
      if (offsetY !== 0) ball.velocity.y *= -1;

      if (offsetX === 0 && offsetY === 0) {
        ball.velocity.y *= -1;
      }

      ball.registerBounce();

      return true;
    }
    return false;
  }

  private resolveEnemyCollision(
    ball: Ball,
    enemies: readonly Enemy[],
    previousX: number,
    previousY: number,
  ): void {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const left = enemy.position.x - Enemy.WIDTH / 2;
      const right = enemy.position.x + Enemy.WIDTH / 2;
      const top = enemy.position.y - Enemy.HEIGHT / 2;
      const bottom = enemy.position.y + Enemy.HEIGHT / 2;
      const closestX = Math.max(left, Math.min(ball.position.x, right));
      const closestY = Math.max(top, Math.min(ball.position.y, bottom));
      const offsetX = ball.position.x - closestX;
      const offsetY = ball.position.y - closestY;

      if (offsetX * offsetX + offsetY * offsetY >= ball.radius * ball.radius) {
        continue;
      }

      this.events.emit({ type: "enemyHit", enemy });
      ball.position.x = previousX;
      ball.position.y = previousY;
      if (offsetX !== 0) ball.velocity.x *= -1;
      if (offsetY !== 0) ball.velocity.y *= -1;
      if (offsetX === 0 && offsetY === 0) ball.velocity.y *= -1;
      ball.registerBounce();
      return;
    }
  }

  private resolveWallCollisions(ball: Ball) {
    const minX = fieldBounds.left + ball.radius;
    const maxX = fieldBounds.right - ball.radius;
    const minY = fieldBounds.top + ball.radius;

    if (ball.position.x < minX) {
      ball.position.x = minX;
      ball.velocity.x = Math.abs(ball.velocity.x);
      ball.registerBounce();
    } else if (ball.position.x > maxX) {
      ball.position.x = maxX;
      ball.velocity.x = -Math.abs(ball.velocity.x);
      ball.registerBounce();
    }

    // hit top wall
    if (ball.position.y < minY) {
      ball.position.y = minY;
      ball.velocity.y = Math.abs(ball.velocity.y);
      ball.registerBounce();

      if (ball.currentSpeed < Ball.MAX_SPEED) {
        ball.setSpeed(Ball.MAX_SPEED);
      }
    }
  }

  private setBallDirection(ball: Ball, angle: number) {
    ball.velocity.x = ball.currentSpeed * Math.sin(angle);
    ball.velocity.y = -ball.currentSpeed * Math.cos(angle);
  }

  private setBallDirectionFromPlayerOffset(
    ball: Ball,
    player: Player,
    offsetX: number,
  ) {
    const normalizedOffset = Math.max(
      -1,
      Math.min(1, offsetX / (player.width / 2)),
    );
    this.setBallDirection(ball, normalizedOffset * MAX_BOUNCE_ANGLE);
  }

  private updateAttachedBall(
    ball: Ball,
    player: Player,
    launchRequested: boolean,
  ) {
    ball.position.x = player.position.x + ball.attachedOffsetX;
    ball.position.y = player.position.y - player.height / 2 - ball.radius;

    if (launchRequested) {
      this.launchBall(ball, player);
    }
  }

  private launchBall(ball: Ball, player: Player) {
    const isFirstRelease = ball.isFirstRelease;
    const offsetX = ball.attachedOffsetX;
    ball.release();
    if (isFirstRelease) {
      this.setBallDirection(ball, LAUNCH_ANGLE);
    } else {
      this.setBallDirectionFromPlayerOffset(ball, player, offsetX);
    }
  }
}
