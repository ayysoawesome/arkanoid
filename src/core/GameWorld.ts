import { worldConfig } from "@/config";
import { Ball, Brick, Player } from "@/entities";
import { BallPhysicsSystem, LevelSystem, PlayerControlSystem } from "@/systems";

type GameStatus = "playing" | "victory" | "defeat";

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.getBallSpawnPosition());
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem();
  private readonly levelSystem = new LevelSystem();
  private remainingLives = worldConfig.initialLives;
  bricks: Brick[] = [];
  private gameStatus: GameStatus = "playing";

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
    if (this.gameStatus !== "playing") return;
    this.playerControl.update({ player: this.player, direction, dtSeconds });
    this.ballPhysics.update({
      player: this.player,
      ball: this.ball,
      launchRequested: spacePressed,
      dtSeconds,
      bricks: this.bricks,
    });
    if (this.levelSystem.isCleared(this.bricks)) {
      if (!this.startNextLevel()) {
        this.gameStatus = "victory";
      }
      return;
    }
    if (!this.ball.alive) {
      this.handleBallLoss();
    }
  }

  get lives(): number {
    return this.remainingLives;
  }

  get status(): GameStatus {
    return this.gameStatus;
  }

  private startCampaign() {
    this.reset();
    const bricks = this.levelSystem.loadNext();
    if (bricks === null) {
      throw new Error("Campaign has no first level");
    }

    this.bricks = bricks;
  }

  private handleBallLoss(): void {
    this.remainingLives--;

    if (this.remainingLives === 0) {
      this.gameStatus = "defeat";
      return;
    }

    this.resetPlayerAndBall();
  }

  private startNextLevel(): boolean {
    const bricks = this.levelSystem.loadNext();
    if (bricks === null) {
      return false;
    }
    this.bricks = bricks;
    this.resetPlayerAndBall();
    return true;
  }

  private reset() {
    this.levelSystem.reset();
    this.resetPlayerAndBall();
  }

  private resetPlayerAndBall(): void {
    this.player.reset();
    this.ball.reset(this.getBallSpawnPosition());
  }

  private getBallSpawnPosition(): { x: number; y: number } {
    return {
      x: this.player.position.x,
      y: this.player.position.y - this.player.height / 2 - Ball.RADIUS,
    };
  }
}
