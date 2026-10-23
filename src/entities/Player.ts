import { fieldBounds, worldConfig } from "@/config";

type PlayerMode = "normal" | "expanded" | "catch" | "laser";

export class Player {
  private static readonly NORMAL_WIDTH = 32;
  private static readonly EXPANDED_WIDTH = 48;

  readonly height = 8;
  readonly speed = 160;
  position = { x: worldConfig.width / 2, y: worldConfig.height - 16 };
  private currentMode: PlayerMode = "normal";

  get width(): number {
    return this.currentMode === "expanded"
      ? Player.EXPANDED_WIDTH
      : Player.NORMAL_WIDTH;
  }

  get mode(): PlayerMode {
    return this.currentMode;
  }

  expand(): void {
    this.currentMode = "expanded";
    const minX = fieldBounds.left + this.width / 2;
    const maxX = fieldBounds.right - this.width / 2;
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
  }

  enableCatch(): void {
    this.currentMode = "catch";
  }

  enableLaser(): void {
    this.currentMode = "laser";
  }

  reset() {
    this.currentMode = "normal";
    this.position.x = worldConfig.width / 2;
    this.position.y = worldConfig.height - 16;
  }
}
