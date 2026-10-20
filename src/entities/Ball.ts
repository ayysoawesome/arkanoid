import { Player } from "./Player";

export class Ball {
  readonly radius: number = 3;
  readonly baseSpeed: number = 120;

  currentSpeed = this.baseSpeed;
  position: { x: number; y: number };
  velocity = { x: 0, y: 0 };
  attached = true;
  alive = true;

  constructor(player: Player) {
    this.position = {
      x: player.position.x,
      y: player.position.y - player.height / 2 - this.radius,
    };
  }
}
