import { worldConfig } from "@/config";
import { GameAssets } from "@/core";
import { Ball, Brick, BrickKind, Player } from "@/entities";
import { Container, Graphics, Sprite } from "pixi.js";

type ColoredBrickKind = Exclude<BrickKind, "silver" | "gold">;

const BRICK_COLORS: Record<ColoredBrickKind, number> = {
  white: 0xf2f2f2,
  orange: 0xff9000,
  "light-blue": 0x00ffff,
  green: 0x00ff00,
  red: 0xff0000,
  blue: 0x0070ff,
  pink: 0xff00ff,
  yellow: 0xffff00,
};

type WorldViewState = {
  readonly player: Player;
  readonly ball: Ball;
  readonly bricks: readonly Brick[];
};

export class WorldView extends Container {
  private readonly playerView: Sprite;
  private readonly ballView: Sprite;
  private bricksView = new Container();
  private readonly brickViews = new Map<Brick, Graphics | Sprite>();

  constructor(
    readonly player: Player,
    readonly ball: Ball,
    bricks: Brick[],
    private readonly assets: GameAssets,
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

    this.addChild(fieldView, this.bricksView, this.playerView, this.ballView);
    this.sync({ player, ball, bricks });
  }

  sync({ player, ball, bricks }: WorldViewState): void {
    this.syncPlayer(player);
    this.syncBall(ball);
    this.syncBricks(bricks);
  }

  private syncBricks(bricks: readonly Brick[]): void {
    const currentBricks = new Set(bricks);

    for (const [brick, view] of this.brickViews) {
      if (currentBricks.has(brick)) continue;

      this.bricksView.removeChild(view);
      view.destroy();
      this.brickViews.delete(brick);
    }

    for (const brick of bricks) {
      let view = this.brickViews.get(brick);

      if (!view) {
        view = this.createBrickView(brick, this.assets);
        this.bricksView.addChild(view);
        this.brickViews.set(brick, view);
      }

      view.position.set(brick.position.x, brick.position.y);
      view.visible = !brick.destroyed;
    }
  }

  private syncPlayer(player: Player) {
    this.playerView.position.set(player.position.x, player.position.y);
  }

  private syncBall(ball: Ball) {
    this.ballView.position.set(ball.position.x, ball.position.y);
  }

  private createBrickView(brick: Brick, assets: GameAssets) {
    if (brick.kind === "silver") {
      return new Sprite(assets.brickSilver);
    }

    if (brick.kind === "gold") {
      return new Sprite(assets.brickGold);
    }

    return new Graphics()
      .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
      .fill(BRICK_COLORS[brick.kind]);
  }
}
