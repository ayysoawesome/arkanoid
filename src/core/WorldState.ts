import type { EnemyGateFrame, EnemyGateSide } from "@/config";
import type { BrickKind, EnemyKind, PowerUpKind } from "@/entities";
import type { PlayerPhaseFrame } from "./PlayerPhase";
import type { GameOutcome } from "./WorldEvent";

export type PositionState = Readonly<{ x: number; y: number }>;
export type PlayerState = Readonly<{
  position: PositionState;
  width: number;
  height: number;
  mode: "normal" | "expanded" | "catch" | "laser";
}>;
export type BallState = Readonly<{
  id: number;
  position: PositionState;
  attached: boolean;
}>;
export type BrickState = Readonly<{
  id: number;
  position: PositionState;
  kind: BrickKind;
  destroyed: boolean;
}>;
export type PowerUpState = Readonly<{
  id: number;
  position: PositionState;
  kind: PowerUpKind;
}>;
export type LaserShotState = Readonly<{
  id: number;
  position: PositionState;
}>;
export type EnemyState = Readonly<{
  id: number;
  position: PositionState;
  kind: EnemyKind;
}>;

export type WorldState = Readonly<{
  player: PlayerState;
  balls: readonly BallState[];
  bricks: readonly BrickState[];
  powerUps: readonly PowerUpState[];
  laserShots: readonly LaserShotState[];
  enemies: readonly EnemyState[];
  lives: number;
  score: number;
  currentLevelIndex: number;
  status: "playing" | GameOutcome;
  exitOpen: boolean;
  gateFrames: Readonly<Record<EnemyGateSide, EnemyGateFrame>>;
  playerPhaseFrame: PlayerPhaseFrame | null;
}>;
