import { Ball, Brick, Player } from "@/entities";
import { fieldBounds } from "@/config";

const MAX_BOUNCE_ANGLE = (70 * Math.PI) / 180;
const LAUNCH_ANGLE = (20 * Math.PI) / 180;

export class BallPhysicsSystem {
  update({
    ball,
    dtSeconds,
    player,
    launchRequested,
    bricks,
  }: {
    ball: Ball;
    player: Player;
    dtSeconds: number;
    launchRequested: boolean;
    bricks: readonly Brick[];
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
    this.resolveBrickCollision(ball, bricks, previousX, previousY);
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

    const hitOffset =
      (ball.position.x - player.position.x) / (player.width / 2);

    const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
    const bounceAngle = clampedOffset * MAX_BOUNCE_ANGLE;

    ball.position.y = playerTop - ball.radius;
    this.setBallDirection(ball, bounceAngle);
  }

  private resolveBrickCollision(
    ball: Ball,
    bricks: readonly Brick[],
    previousX: number,
    previousY: number,
  ): void {
    for (const brick of bricks) {
      if (brick.destroyed) continue;

      const left = brick.position.x;
      const right = left + Brick.WIDTH;
      const top = brick.position.y;
      const bottom = top + Brick.HEIGHT;

      const closestX = Math.max(left, Math.min(ball.position.x, right));
      const closestY = Math.max(top, Math.min(ball.position.y, bottom));
      const offsetX = ball.position.x - closestX;
      const offsetY = ball.position.y - closestY;

      if (offsetX * offsetX + offsetY * offsetY >= ball.radius * ball.radius) {
        continue;
      }

      brick.hit();

      ball.position.x = previousX;
      ball.position.y = previousY;

      if (offsetX !== 0) ball.velocity.x *= -1;
      if (offsetY !== 0) ball.velocity.y *= -1;

      if (offsetX === 0 && offsetY === 0) {
        ball.velocity.y *= -1;
      }

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
    } else if (ball.position.x > maxX) {
      ball.position.x = maxX;
      ball.velocity.x = -Math.abs(ball.velocity.x);
    }

    if (ball.position.y < minY) {
      ball.position.y = minY;
      ball.velocity.y = Math.abs(ball.velocity.y);
    }
  }

  private setBallDirection(ball: Ball, angle: number) {
    ball.velocity.x = ball.currentSpeed * Math.sin(angle);
    ball.velocity.y = -ball.currentSpeed * Math.cos(angle);
  }

  private updateAttachedBall(
    ball: Ball,
    player: Player,
    launchRequested: boolean,
  ) {
    ball.position.x = player.position.x;
    ball.position.y = player.position.y - player.height / 2 - ball.radius;

    if (launchRequested) {
      this.launchBall(ball);
    }
  }

  private launchBall(ball: Ball) {
    ball.attached = false;
    this.setBallDirection(ball, LAUNCH_ANGLE);
  }
}
