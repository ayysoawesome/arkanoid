import { fieldBounds } from "@/config";
import { Ball, Brick, Player } from "@/entities";
import { BallPhysicsSystem, PlayerControlSystem } from "@/systems";

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.player);
  readonly bricks: Brick[] = this.createBricks();
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem();

  update({
    direction,
    spacePressed,
    dtSeconds,
  }: {
    direction: number;
    spacePressed: boolean;
    dtSeconds: number;
  }): void {
    this.playerControl.update({ player: this.player, direction, dtSeconds });
    this.ballPhysics.update({
      player: this.player,
      ball: this.ball,
      launchRequested: spacePressed,
      dtSeconds,
      bricks: this.bricks,
    });
  }

  private createBricks(): Brick[] {
    const columns = 10;
    const rows = 4;
    const gap = 2;
    const bricks: Brick[] = [];

    const fieldWidth = fieldBounds.right - fieldBounds.left;
    const rowWidth = columns * Brick.WIDTH + (columns - 1) * gap;
    const startX = fieldBounds.left + (fieldWidth - rowWidth) / 2;
    const startY = fieldBounds.top + 24;

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const brickPosition = {
          x: startX + column * (Brick.WIDTH + gap),
          y: startY + row * (Brick.HEIGHT + gap),
        };
        bricks.push(new Brick(brickPosition));
      }
    }

    return bricks;
  }
}
