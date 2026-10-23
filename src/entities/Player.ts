import { worldConfig } from "@/config";

export class Player {
  readonly width = 32;
  readonly height = 8;
  readonly speed = 160;
  position = { x: worldConfig.width / 2, y: worldConfig.height - 16 };

  reset() {
    this.position.x = worldConfig.width / 2;
    this.position.y = worldConfig.height - 16;
  }
}
