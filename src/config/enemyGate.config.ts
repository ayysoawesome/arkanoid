import { worldConfig } from "./world.config";

export type EnemyGateSide = "left" | "right";
export type EnemyGateFrame = 0 | 1 | 2;

const GATE_WIDTH = 24;
const GATE_SIDE_OFFSET = 40;

export const enemyGateConfig = {
  width: GATE_WIDTH,
  height: 8,
  leftX: GATE_SIDE_OFFSET,
  rightX: worldConfig.width - GATE_SIDE_OFFSET - GATE_WIDTH,
  openingSeconds: 0.5,
  openAfterSpawnSeconds: 1,
} as const;

export const enemyGateX: Readonly<Record<EnemyGateSide, number>> = {
  left: enemyGateConfig.leftX,
  right: enemyGateConfig.rightX,
};
