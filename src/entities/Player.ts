import { fieldBounds, worldConfig } from "@/config";

type PlayerMode = "normal" | "expanded" | "catch" | "laser";

export class Player {
  private static readonly NORMAL_WIDTH = 32;
  private static readonly EXPANDED_WIDTH = 48;
  private static readonly RESIZE_DURATION_SECONDS = 0.2;

  readonly height = 8;
  readonly speed = 160;
  position = { x: worldConfig.width / 2, y: worldConfig.height - 16 };
  private currentMode: PlayerMode = "normal";
  private currentWidth = Player.NORMAL_WIDTH;

  get width(): number {
    return Math.round(this.currentWidth);
  }

  get mode(): PlayerMode {
    return this.currentMode;
  }

  expand(): void {
    this.currentMode = "expanded";
    const minX = fieldBounds.left + Player.EXPANDED_WIDTH / 2;
    const maxX = fieldBounds.right - Player.EXPANDED_WIDTH / 2;
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
  }

  update(dtSeconds: number): void {
    const targetWidth =
      this.currentMode === "expanded"
        ? Player.EXPANDED_WIDTH
        : Player.NORMAL_WIDTH;
    const widthStep =
      ((Player.EXPANDED_WIDTH - Player.NORMAL_WIDTH) * dtSeconds) /
      Player.RESIZE_DURATION_SECONDS;

    if (this.currentWidth < targetWidth) {
      this.currentWidth = Math.min(targetWidth, this.currentWidth + widthStep);
    } else if (this.currentWidth > targetWidth) {
      this.currentWidth = Math.max(targetWidth, this.currentWidth - widthStep);
    }
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
