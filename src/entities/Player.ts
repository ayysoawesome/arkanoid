import { worldConfig } from "@/config";

export class Player {
  readonly width = 32;
  readonly height = 6;
  readonly speed = 160;
  position = { x: worldConfig.width / 2, y: worldConfig.height - 16 };
}
