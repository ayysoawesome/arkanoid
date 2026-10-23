import { Player } from "./Player";

export class Ball {
  static readonly INITIAL_SPEED = 120;
  static readonly SPEED_INCREMENT = 12;
  static readonly MAX_SPEED = 180;
  static readonly COLLISIONS_PER_INCREASE = 10;

  readonly radius: number = 3;
  collisionsSinceIncrease = 0;
  currentSpeed: number = Ball.INITIAL_SPEED;
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

  reset(player: Player): void {
    this.currentSpeed = Ball.INITIAL_SPEED;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.attached = true;
    this.alive = true;
    this.collisionsSinceIncrease = 0;

    this.position.x = player.position.x;
    this.position.y = player.position.y - player.height / 2 - this.radius;
  }
}
