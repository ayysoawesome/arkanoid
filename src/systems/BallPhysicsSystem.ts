import { Ball, Brick, Enemy, Player } from "@/entities";
import { fieldBounds } from "@/config";
import type { HitResolver } from "./HitResolver";

const MAX_BOUNCE_ANGLE = (70 * Math.PI) / 180;
const LAUNCH_ANGLE = (20 * Math.PI) / 180;
const ESCAPE_ANGLE = (12 * Math.PI) / 180;
const REPEATED_HITS_TO_ESCAPE = 20;

type BounceObstacle = Brick | "left" | "right" | "top";
type BounceHistory = {
  first: BounceObstacle;
  second?: BounceObstacle;
  count: number;
};

export class BallPhysicsSystem {
  private readonly bounceHistory = new WeakMap<Ball, BounceHistory>();

  constructor(private readonly hits: HitResolver) {}

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
      this.bounceHistory.delete(ball);
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
      this.bounceHistory.delete(ball);
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
    this.bounceHistory.delete(ball);

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

      this.hits.resolveBrickHit(brick);

      ball.position.x = previousX;
      ball.position.y = previousY;

      if (offsetX !== 0) ball.velocity.x *= -1;
      if (offsetY !== 0) ball.velocity.y *= -1;

      if (offsetX === 0 && offsetY === 0) {
        ball.velocity.y *= -1;
      }

      ball.registerBounce();
      if (brick.kind === "gold") {
        const normalX = Math.sign(offsetX);
        const normalY =
          offsetX === 0 && offsetY === 0
            ? Math.sign(ball.velocity.y)
            : Math.sign(offsetY);
        this.recordRepeatedHit(ball, brick, normalX, normalY);
      } else {
        this.bounceHistory.delete(ball);
      }

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

      this.hits.resolveEnemyHit(enemy);
      this.bounceHistory.delete(ball);
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
      this.recordRepeatedHit(ball, "left", 1, 0);
    } else if (ball.position.x > maxX) {
      ball.position.x = maxX;
      ball.velocity.x = -Math.abs(ball.velocity.x);
      ball.registerBounce();
      this.recordRepeatedHit(ball, "right", -1, 0);
    }

    // hit top wall
    if (ball.position.y < minY) {
      ball.position.y = minY;
      ball.velocity.y = Math.abs(ball.velocity.y);
      ball.registerBounce();

      if (ball.currentSpeed < Ball.MAX_SPEED) {
        ball.setSpeed(Ball.MAX_SPEED);
      }
      this.recordRepeatedHit(ball, "top", 0, 1);
    }
  }

  private recordRepeatedHit(
    ball: Ball,
    obstacle: BounceObstacle,
    normalX: number,
    normalY: number,
  ): void {
    const history = this.bounceHistory.get(ball);
    if (history === undefined) {
      this.bounceHistory.set(ball, { first: obstacle, count: 1 });
      return;
    }

    if (obstacle !== history.first && obstacle !== history.second) {
      if (history.second === undefined) {
        history.second = obstacle;
      } else {
        history.first = obstacle;
        history.second = undefined;
        history.count = 0;
      }
    }
    if (++history.count < REPEATED_HITS_TO_ESCAPE) return;

    const cos = Math.cos(ESCAPE_ANGLE);
    const sin = Math.sin(ESCAPE_ANGLE);
    const { x, y } = ball.velocity;
    let nextX = x * cos - y * sin;
    let nextY = x * sin + y * cos;
    if (nextX * normalX + nextY * normalY <= 0) {
      nextX = x * cos + y * sin;
      nextY = -x * sin + y * cos;
    }
    if (nextX * normalX + nextY * normalY <= 0) return;

    ball.velocity.x = nextX;
    ball.velocity.y = nextY;
    history.first = obstacle;
    history.second = undefined;
    history.count = 0;
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
