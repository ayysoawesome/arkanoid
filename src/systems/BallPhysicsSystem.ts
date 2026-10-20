import { Ball, Player } from "@/entities";
import { fieldBounds } from "@/config";

const MAX_BOUNCE_ANGLE = (70 * Math.PI) / 180;
const LAUNCH_ANGLE = (20 * Math.PI) / 180;

export class BallPhysicsSystem {
  update({
    ball,
    dtSeconds,
    player,
    launchRequested,
  }: {
    ball: Ball;
    player: Player;
    dtSeconds: number;
    launchRequested: boolean;
  }): void {
    if (ball.attached) {
      this.updateAttachedBall(ball, player, launchRequested);
      return;
    }

    const ballY = ball.position.y;

    this.moveBall(ball, dtSeconds);
    this.resolveWallCollisions(ball);

    this.resolvePlayerCollision(ball, player, ballY);
  }

  private moveBall(ball: Ball, dtSeconds: number) {
    ball.position.x += ball.velocity.x * dtSeconds;
    ball.position.y += ball.velocity.y * dtSeconds;
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
