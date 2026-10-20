import { Ball, Player } from "@/entities";
import { BallPhysicsSystem, PlayerControlSystem } from "@/systems";

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.player);
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem();

  update({
    direction,
    spacePressed,
    dtSeconds,
  }: {
    direction: number;
    spacePressed: boolean;
    dtSeconds: number;
  }): void {
    this.playerControl.update(this.player, direction, dtSeconds);
    this.ballPhysics.update({
      player: this.player,
      ball: this.ball,
      launchRequested: spacePressed,
      dtSeconds,
    });
  }
}
