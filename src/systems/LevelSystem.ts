import { fieldBounds } from "@/config";
import { Brick } from "@/entities";
import { levels, type EnemySpawnDef } from "@/levels";

const GRID_COLUMNS = 11;
const GAP = 3;
const START_Y = fieldBounds.top + 24;

export class LevelSystem {
  private currentIndex: number = 0;

  get currentLevelIndex(): number {
    return this.currentIndex;
  }

  getEnemySpawns(): readonly EnemySpawnDef[] {
    return (
      levels.find((level) => level.index === this.currentIndex)?.enemySpawns ??
      []
    );
  }

  load(index: number): Brick[] {
    const level = levels.find((item) => item.index === index);
    if (!level) {
      throw new Error(`Level ${index} does not exist`);
    }
    const fieldWidth = fieldBounds.right - fieldBounds.left;

    const gridWidth = GRID_COLUMNS * Brick.WIDTH + (GRID_COLUMNS - 1) * GAP;
    const startX = fieldBounds.left + (fieldWidth - gridWidth) / 2;

    return level.bricks.map(({ row, column, kind, canDropCapsule }) => {
      if (column < 0 || column > 10) {
        throw new Error("Max column index is 10");
      }

      const position = {
        x: startX + column * (Brick.WIDTH + GAP) + Brick.WIDTH / 2,
        y: START_Y + row * (Brick.HEIGHT + GAP) + Brick.HEIGHT / 2,
      };

      return new Brick(position, kind, canDropCapsule);
    });
  }

  hasNextLevel(): boolean {
    return levels.some((level) => level.index === this.currentIndex + 1);
  }

  loadNext(): Brick[] {
    if (!this.hasNextLevel()) {
      throw new Error("No next level available");
    }

    return this.loadAt(this.currentIndex + 1);
  }

  loadAt(index: number): Brick[] {
    const bricks = this.load(index);
    this.currentIndex = index;
    return bricks;
  }

  reset() {
    this.currentIndex = 0;
  }

  isCleared(bricks: readonly Brick[]): boolean {
    const breakable = bricks.filter((brick) => brick.kind !== "gold");
    return breakable.length > 0 && breakable.every((brick) => brick.destroyed);
  }
}
