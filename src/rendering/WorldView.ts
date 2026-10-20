import { worldConfig } from "@/config";
import { Ball, Player } from "@/entities";
import { Container, Graphics } from "pixi.js";

type WorldViewState = {
  readonly player: Player;
  readonly ball: Ball;
};

export class WorldView extends Container {
  private readonly playerView = new Graphics();
  private readonly ballView = new Graphics();

  constructor(player: Player, ball: Ball) {
    super();

    const fieldView = new Graphics()
      .rect(0, 0, worldConfig.width, worldConfig.height)
      .fill(0x183060);

    this.playerView
      .rect(-player.width / 2, -player.height / 2, player.width, player.height)
      .fill(0xffffff);

    this.ballView.circle(0, 0, ball.radius).fill(0xffffff);

    this.addChild(fieldView, this.playerView, this.ballView);
    this.sync({ player, ball });
  }

  sync({ player, ball }: WorldViewState): void {
    this.syncPlayer(player);
    this.syncBall(ball);
  }

  private syncPlayer(player: Player) {
    this.playerView.position.set(player.position.x, player.position.y);
  }

  private syncBall(ball: Ball) {
    this.ballView.position.set(ball.position.x, ball.position.y);
  }
}
