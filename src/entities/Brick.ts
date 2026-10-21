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
  health: number = 1;
  destroyed: boolean = false;

  constructor(
    readonly position: { x: number; y: number },
    readonly kind: BrickKind,
  ) {
    if (this.kind === "silver") {
      this.health = 2;
    }
  }

  hit() {
    if (this.destroyed || this.kind === "gold") return;

    if (this.health <= 1) this.destroyed = true;

    this.health--;
  }
}
