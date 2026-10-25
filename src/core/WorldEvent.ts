import type { Brick, BrickKind, Enemy, PowerUpKind } from "@/entities";
import type { EnemyState } from "./WorldState";

export type GameOutcome = "victory" | "defeat";

export type BrickHitEvent = {
  type: "brickHit";
  brickId: number;
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

export type EnemyHitEvent = { type: "enemyHit"; enemyId: number };
export type EnemyDestroyedEvent = { type: "enemyDestroyed"; enemy: EnemyState };

export type InternalBrickHitEvent = { type: "brickHit"; brick: Brick };
export type InternalEnemyHitEvent = { type: "enemyHit"; enemy: Enemy };
export type InternalEnemyDestroyedEvent = {
  type: "enemyDestroyed";
  enemy: Enemy;
};

export type WorldEvent = Readonly<
  | PowerUpCollectedEvent
  | BrickHitEvent
  | BrickDestroyedEvent
  | ScoreChangedEvent
  | EnemyHitEvent
  | EnemyDestroyedEvent
  | { type: "levelStarted"; levelIndex: number }
  | { type: "levelCleared"; levelIndex: number }
  | { type: "levelExited"; levelIndex: number }
  | { type: "lifeLost"; remainingLives: number }
  | { type: "lifeGained"; remainingLives: number }
  | { type: "gameEnded"; outcome: GameOutcome }
>;

export type InternalWorldEvent =
  | Exclude<WorldEvent, BrickHitEvent | EnemyHitEvent | EnemyDestroyedEvent>
  | InternalBrickHitEvent
  | InternalEnemyHitEvent
  | InternalEnemyDestroyedEvent;
