import { fieldBounds, worldConfig } from "@/config";

export class Player {
  private static readonly NORMAL_WIDTH = 32;
  private static readonly EXPANDED_WIDTH = 48;

  readonly height = 8;
  readonly speed = 160;
  position = { x: worldConfig.width / 2, y: worldConfig.height - 16 };
  private expanded = false;
  private catchEnabled = false;

  get width(): number {
    return this.expanded ? Player.EXPANDED_WIDTH : Player.NORMAL_WIDTH;
  }

  get isExpanded(): boolean {
    return this.expanded;
  }

  get canCatchBall(): boolean {
    return this.catchEnabled;
  }

  expand(): void {
    this.expanded = true;
    const minX = fieldBounds.left + this.width / 2;
    const maxX = fieldBounds.right - this.width / 2;
    this.position.x = Math.max(minX, Math.min(maxX, this.position.x));
  }

  enableCatch(): void {
    this.catchEnabled = true;
  }

  reset() {
    this.expanded = false;
    this.catchEnabled = false;
    this.position.x = worldConfig.width / 2;
    this.position.y = worldConfig.height - 16;
  }
}
