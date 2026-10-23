export class Ball {
  static readonly RADIUS = 3;
  static readonly INITIAL_SPEED = 120;
  static readonly SPEED_INCREMENT = 12;
  static readonly MAX_SPEED = 180;
  static readonly COLLISIONS_PER_INCREASE = 10;

  readonly radius = Ball.RADIUS;
  private collisionsSinceIncrease = 0;
  private speed = Ball.INITIAL_SPEED;
  position: { x: number; y: number };
  velocity = { x: 0, y: 0 };
  attached = true;
  alive = true;

  constructor(position: { x: number; y: number }) {
    this.position = { ...position };
  }

  get currentSpeed(): number {
    return this.speed;
  }

  reset(position: { x: number; y: number }): void {
    this.speed = Ball.INITIAL_SPEED;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.attached = true;
    this.alive = true;
    this.collisionsSinceIncrease = 0;

    this.position.x = position.x;
    this.position.y = position.y;
  }

  registerBounce(): void {
    if (this.attached || !this.alive) return;
    if (this.currentSpeed >= Ball.MAX_SPEED) return;

    this.collisionsSinceIncrease++;
    if (this.collisionsSinceIncrease < Ball.COLLISIONS_PER_INCREASE) {
      return;
    }

    this.setSpeed(this.currentSpeed + Ball.SPEED_INCREMENT);
  }

  setSpeed(speed: number): void {
    const nextSpeed = Math.min(speed, Ball.MAX_SPEED);
    if (nextSpeed === this.currentSpeed) return;

    const scale = nextSpeed / this.currentSpeed;
    this.velocity.x *= scale;
    this.velocity.y *= scale;
    this.speed = nextSpeed;
    this.collisionsSinceIncrease = 0;
  }
}
