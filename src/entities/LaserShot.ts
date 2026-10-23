import { fieldBounds } from "@/config";

export class LaserShot {
  static readonly WIDTH = 5;
  static readonly HEIGHT = 12;
  static readonly SPEED = 240;

  readonly position: { x: number; y: number };

  constructor(position: { x: number; y: number }) {
    this.position = { ...position };
  }

  advance(dtSeconds: number): void {
    this.position.y -= LaserShot.SPEED * dtSeconds;
  }

  shouldDestroy(): boolean {
    return this.position.y + LaserShot.HEIGHT / 2 < fieldBounds.top;
  }
}
