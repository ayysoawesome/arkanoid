import { worldConfig } from "@/config";
import { Container, Graphics } from "pixi.js";

export class WorldView extends Container {
  constructor() {
    super();

    const field = new Graphics()
      .rect(0, 0, worldConfig.width, worldConfig.height)
      .fill(0x183060);
    this.addChild(field);
  }
}
