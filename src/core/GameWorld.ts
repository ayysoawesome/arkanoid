import { Player } from "@/entities";
import { PlayerControlSystem } from "@/systems";

export class GameWorld {
  readonly player = new Player();
  private readonly playerControl = new PlayerControlSystem();

  update(direction: number, dtSeconds: number): void {
    this.playerControl.update(this.player, direction, dtSeconds);
  }
}
