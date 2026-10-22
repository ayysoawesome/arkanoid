import { GameAssets, GameWorld, InputManager, Scene } from "@/core";
import { WorldView } from "@/rendering";
import { GameHud } from "@/ui/hud";
import { worldConfig } from "@/config";

export class GameScene extends Scene {
  private readonly world = new GameWorld();
  private readonly worldView: WorldView;
  private readonly hud = new GameHud();

  constructor(
    private readonly inputManager: InputManager,
    assets: GameAssets,
  ) {
    super();

    this.worldView = new WorldView(
      this.world.player,
      this.world.ball,
      this.world.bricks,
      assets,
    );

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

  update(dtSeconds: number): void {
    const direction = this.inputManager.horizontal;
    const spacePressed = this.inputManager.consumeKeyPress("Space");

    this.world.update({ direction, spacePressed, dtSeconds });
    this.worldView.sync({
      player: this.world.player,
      ball: this.world.ball,
      bricks: this.world.bricks,
    });
  }
}
