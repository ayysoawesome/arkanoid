import { fieldBounds } from "@/config";

export type PowerUpKind =
  "laser" | "expand" | "catch" | "disrupt" | "slow" | "break" | "player";

export const POWER_UP_KINDS: readonly PowerUpKind[] = [
  "laser",
  "expand",
  "catch",
  "disrupt",
  "slow",
  "break",
  "player",
];

export class PowerUp {
  static readonly WIDTH = 16;
  static readonly HEIGHT = 8;
  static readonly FALLING_SPEED = 120;

  position: { x: number; y: number };

  constructor(
    position: { x: number; y: number },
    readonly kind: PowerUpKind,
  ) {
    this.position = { ...position };
  }

  fall(dtSeconds: number): void {
    this.position.y += dtSeconds * PowerUp.FALLING_SPEED;
  }

  shouldDestroy(): boolean {
    return this.position.y > fieldBounds.bottom + PowerUp.HEIGHT / 2;
  }
}
