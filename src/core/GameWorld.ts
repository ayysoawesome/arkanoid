import { Ball, Player } from "@/entities";
import { PlayerControlSystem } from "@/systems";

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.player);
  private readonly playerControl = new PlayerControlSystem();

  update(direction: number, dtSeconds: number): void {
    this.playerControl.update(this.player, direction, dtSeconds);
    if (this.ball.attached) {
      this.ball.position.x = this.player.position.x;
      this.ball.position.y =
        this.player.position.y - this.player.height / 2 - this.ball.radius;
    }
  }
}
