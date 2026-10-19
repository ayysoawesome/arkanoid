import { WorldView } from "@/rendering";
import { GameHud } from "@/ui/hud";
import { worldConfig } from "@/config";
import { Scene } from "@/core/SceneManager";

export class GameScene extends Scene {
  private readonly worldView = new WorldView();
  private readonly hud = new GameHud();

  constructor() {
    super();

    this.addChild(this.worldView, this.hud);
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    const scale = height / worldConfig.height;

    const gameField = {
      width: worldConfig.width * scale,
      height: worldConfig.height * scale,
    };

    this.worldView.scale.set(scale);
    this.worldView.position.set(0, 0);

    this.hud.position.set(gameField.width, 0);
  }
}
