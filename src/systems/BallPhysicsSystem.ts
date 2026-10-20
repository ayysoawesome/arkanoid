import { Ball, Player } from "@/entities";

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
      ball.position.x = player.position.x;
      ball.position.y = player.position.y - player.height / 2 - ball.radius;

      if (launchRequested) {
        ball.attached = false;
        ball.velocity.x = 0;
        ball.velocity.y = -ball.currentSpeed;
      }
      return;
    }

    ball.position.x += ball.velocity.x * dtSeconds;
    ball.position.y += ball.velocity.y * dtSeconds;
  }
}
