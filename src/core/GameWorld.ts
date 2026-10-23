import { worldConfig } from "@/config";
import { Ball, Brick, Player } from "@/entities";
import {
  BallPhysicsSystem,
  BrickSystem,
  LevelSystem,
  PlayerControlSystem,
} from "@/systems";
import { EventQueue } from "./EventQueue";
import type { GameOutcome, WorldEvent } from "./WorldEvent";

type GameStatus = "playing" | GameOutcome;

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.getBallSpawnPosition());
  bricks: Brick[] = [];
  private readonly events = new EventQueue<WorldEvent>();
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem(this.events);
  private readonly brickSystem = new BrickSystem(this.events);
  private readonly levelSystem = new LevelSystem();
  private remainingLives = worldConfig.initialLives;
  private gameStatus: GameStatus = "playing";

  constructor() {
    this.events.subscribe(this.handleEvent);
    this.startCampaign();
  }

  onEvent(listener: (event: WorldEvent) => void): () => void {
    return this.events.subscribe(listener);
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
    this.events.flush();
    if (this.levelSystem.isCleared(this.bricks)) {
      this.events.emit({
        type: "levelCleared",
        levelIndex: this.levelSystem.currentLevelIndex,
      });
      if (this.levelSystem.hasNextLevel()) {
        this.startNextLevel();
      } else {
        this.finishGame("victory");
      }
      this.events.flush();
      return;
    }
    if (!this.ball.alive) {
      this.handleBallLoss();
      this.events.flush();
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
    if (!this.levelSystem.hasNextLevel()) {
      throw new Error("Campaign has no first level");
    }

    this.bricks = this.levelSystem.loadNext();
  }

  private handleBallLoss(): void {
    this.remainingLives--;
    this.events.emit({
      type: "lifeLost",
      remainingLives: this.remainingLives,
    });

    if (this.remainingLives === 0) {
      this.finishGame("defeat");
      return;
    }

    this.resetPlayerAndBall();
  }

  private readonly handleEvent = (event: WorldEvent): void => {
    if (event.type === "brickHit") {
      this.brickSystem.handleHit(event.brick);
    }
  };

  private finishGame(outcome: GameOutcome): void {
    this.gameStatus = outcome;
    this.events.emit({ type: "gameEnded", outcome });
  }

  private startNextLevel(): void {
    this.bricks = this.levelSystem.loadNext();
    this.resetPlayerAndBall();
  }

  private reset(): void {
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
