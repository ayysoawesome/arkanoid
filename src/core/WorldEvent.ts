import type { Brick, BrickKind, PowerUpKind } from "@/entities";

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

export type PowerUpCollectedEvent = {
  type: "powerUpCollected";
  kind: PowerUpKind;
};

export type ScoreChangedEvent = {
  type: "scoreChanged";
  score: number;
};

export type WorldEvent =
  | PowerUpCollectedEvent
  | BrickHitEvent
  | BrickDestroyedEvent
  | ScoreChangedEvent
  | { type: "levelCleared"; levelIndex: number }
  | { type: "levelExited"; levelIndex: number }
  | { type: "lifeLost"; remainingLives: number }
  | { type: "lifeGained"; remainingLives: number }
  | { type: "gameEnded"; outcome: GameOutcome };
