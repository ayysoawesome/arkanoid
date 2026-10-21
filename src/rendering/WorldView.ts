import { worldConfig } from "@/config";
import { GameAssets } from "@/core";
import { Ball, Brick, Player } from "@/entities";
import { Container, Graphics, Sprite } from "pixi.js";

type WorldViewState = {
  readonly player: Player;
  readonly ball: Ball;
};

export class WorldView extends Container {
  private readonly playerView: Sprite;
  private readonly ballView: Sprite;
  private bricksView = new Container();
  private readonly brickViews = new Map<Brick, Graphics>();

  constructor(
    readonly player: Player,
    readonly ball: Ball,
    readonly bricks: Brick[],
    assets: GameAssets,
  ) {
    super();

    const fieldView = new Sprite(assets.field1);
    fieldView.anchor.set(0, 0);
    fieldView.position.set(0, 0);
    fieldView.setSize(worldConfig.width, worldConfig.height);

    this.playerView = new Sprite(assets.player);
    this.playerView.anchor.set(0.5);

    this.ballView = new Sprite(assets.ball);
    this.ballView.anchor.set(0.5);

    for (const brick of bricks) {
      const view = new Graphics()
        .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
        .fill(0xff6600);

      view.position.set(brick.position.x, brick.position.y);
      this.bricksView.addChild(view);
      this.brickViews.set(brick, view);
    }

    this.addChild(
      fieldView,

      this.bricksView,
      this.playerView,
      this.ballView,
    );
    this.sync({ player, ball });
  }

  sync({ player, ball }: WorldViewState): void {
    this.syncPlayer(player);
    this.syncBall(ball);

    for (const [brick, view] of this.brickViews) {
      view.visible = !brick.destroyed;
    }
  }

  private syncPlayer(player: Player) {
    this.playerView.position.set(player.position.x, player.position.y);
  }

  private syncBall(ball: Ball) {
    this.ballView.position.set(ball.position.x, ball.position.y);
  }
}
