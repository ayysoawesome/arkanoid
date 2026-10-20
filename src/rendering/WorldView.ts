import { worldConfig } from "@/config";
import { Player } from "@/entities";
import { Container, Graphics } from "pixi.js";

export class WorldView extends Container {
  private readonly playerView = new Graphics();

  constructor(player: Player) {
    super();

    const fieldView = new Graphics()
      .rect(0, 0, worldConfig.width, worldConfig.height)
      .fill(0x183060);

    this.playerView
      .rect(-player.width / 2, -player.height / 2, player.width, player.height)
      .fill(0xffffff);

    this.addChild(fieldView, this.playerView);
    this.syncPlayer(player);
  }

  syncPlayer(player: Player) {
    this.playerView.position.set(player.position.x, player.position.y);
  }
}
