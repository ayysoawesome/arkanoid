export const ENEMY_KINDS = [
  "blueShip",
  "yellowShip",
  "blueOrb",
  "redOrb",
] as const;

export type EnemyKind = (typeof ENEMY_KINDS)[number];

export class Enemy {
  static readonly WIDTH = 16;
  static readonly HEIGHT = 16;

  alive = true;

  constructor(
    readonly kind: EnemyKind,
    readonly position: { x: number; y: number },
    readonly velocity: { x: number; y: number },
  ) {}

  destroy(): void {
    this.alive = false;
  }
}
