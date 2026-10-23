export type BrickKind =
  | "white"
  | "orange"
  | "light-blue"
  | "green"
  | "red"
  | "blue"
  | "pink"
  | "yellow"
  | "silver"
  | "gold";

export class Brick {
  static readonly WIDTH: number = 16;
  static readonly HEIGHT: number = 8;
  private remainingHealth = 1;
  private isDestroyed = false;

  get health(): number {
    return this.remainingHealth;
  }

  get destroyed(): boolean {
    return this.isDestroyed;
  }

  constructor(
    readonly position: { x: number; y: number },
    readonly kind: BrickKind,
    readonly canDropCapsule = false,
  ) {
    if (this.kind === "silver") {
      this.remainingHealth = 2;
    }
  }

  hit(): void {
    if (this.destroyed || this.kind === "gold") return;

    if (this.remainingHealth <= 1) this.isDestroyed = true;

    this.remainingHealth--;
  }
}
