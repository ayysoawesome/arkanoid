import type { Brick, BrickKind } from "@/entities";

export type GameOutcome = "victory" | "defeat";

export type BrickHitEvent = {
  type: "brickHit";
  brick: Brick;
};

export type BrickDestroyedEvent = {
  type: "brickDestroyed";
  brickKind: BrickKind;
  canDropCapsule: boolean;
  position: Readonly<{ x: number; y: number }>;
};

export type WorldEvent =
  | BrickHitEvent
  | BrickDestroyedEvent
  | { type: "levelCleared"; levelIndex: number }
  | { type: "lifeLost"; remainingLives: number }
  | { type: "gameEnded"; outcome: GameOutcome };
