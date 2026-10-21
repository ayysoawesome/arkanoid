import { Ball, Brick, Player } from "@/entities";
import { BallPhysicsSystem, LevelSystem, PlayerControlSystem } from "@/systems";

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.player);
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem();
  private readonly levelSystem = new LevelSystem();
  bricks: Brick[] = [];

  constructor() {
    this.startCampaign();
  }

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
    if (this.levelSystem.isCleared(this.bricks)) {
      this.startNextLevel();
    }
  }

  private startCampaign() {
    this.reset();
    const bricks = this.levelSystem.loadNext();
    if (bricks === null) {
      throw new Error("Campaign has no first level");
    }

    this.bricks = bricks;
  }

  private startNextLevel(): boolean {
    const bricks = this.levelSystem.loadNext();
    if (bricks === null) {
      return false;
    }
    this.bricks = bricks;
    this.player.reset();
    this.ball.reset(this.player);
    return true;
  }

  private reset() {
    this.levelSystem.reset();
    this.player.reset();
    this.ball.reset(this.player);
  }
}
