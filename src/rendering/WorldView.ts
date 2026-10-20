import { fieldBounds, worldConfig } from "@/config";
import { Ball, Brick, Player } from "@/entities";
import { Container, Graphics } from "pixi.js";

type WorldViewState = {
  readonly player: Player;
  readonly ball: Ball;
};

export class WorldView extends Container {
  private readonly playerView = new Graphics();
  private readonly ballView = new Graphics();
  private bricksView = new Container();
  private readonly brickViews = new Map<Brick, Graphics>();

  constructor(
    readonly player: Player,
    readonly ball: Ball,
    readonly bricks: Brick[],
  ) {
    super();

    const fieldView = new Graphics()
      .rect(0, 0, worldConfig.width, worldConfig.height)
      .fill(0x183060);

    this.playerView
      .rect(-player.width / 2, -player.height / 2, player.width, player.height)
      .fill(0xffffff);

    this.ballView.circle(0, 0, ball.radius).fill(0xffffff);

    for (const brick of bricks) {
      const view = new Graphics()
        .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
        .fill(0xff6600);

      view.position.set(brick.position.x, brick.position.y);
      this.bricksView.addChild(view);
      this.brickViews.set(brick, view);
    }

    const { left, right, top } = fieldBounds;

    const wallsView = new Graphics()
      .rect(0, 0, left, worldConfig.height)
      .fill(0xaaaaaa)
      .rect(right, 0, worldConfig.width - right, worldConfig.height)
      .fill(0xaaaaaa)
      .rect(left, 0, right - left, top)
      .fill(0xaaaaaa);

    this.addChild(
      fieldView,
      wallsView,
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
