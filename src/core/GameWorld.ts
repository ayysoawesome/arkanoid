import { worldConfig } from "@/config";
import { Ball, Brick, Player, PowerUp, type PowerUpKind } from "@/entities";
import {
  BallPhysicsSystem,
  BrickSystem,
  LevelSystem,
  PlayerControlSystem,
  PowerUpSystem,
} from "@/systems";
import { EventQueue } from "./EventQueue";
import type { GameOutcome, WorldEvent } from "./WorldEvent";

type GameStatus = "playing" | GameOutcome;
const SLOW_FACTOR = 0.75;

export class GameWorld {
  readonly player = new Player();
  readonly ball = new Ball(this.getBallSpawnPosition());
  bricks: Brick[] = [];
  readonly powerUps: PowerUp[] = [];
  private readonly events = new EventQueue<WorldEvent>();
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem(this.events);
  private readonly brickSystem = new BrickSystem(this.events);
  private readonly powerUpSystem = new PowerUpSystem(this.events);
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
    this.powerUpSystem.update({
      powerUpArr: this.powerUps,
      dtSeconds,
      player: this.player,
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
    this.clearPowerUps();
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

    if (event.type === "brickDestroyed") {
      this.powerUpSystem.handleBrickDestroyed(event, this.powerUps);
    }

    if (event.type === "powerUpCollected") {
      this.applyPowerUp(event.kind);
    }
  };

  private applyPowerUp(kind: PowerUpKind): void {
    if (kind === "expand") {
      this.player.expand();
      return;
    }

    if (kind === "catch") {
      this.player.enableCatch();
      return;
    }

    if (kind === "slow") {
      this.ball.setSpeed(this.ball.currentSpeed * SLOW_FACTOR);
      return;
    }

    if (kind === "player") {
      this.remainingLives++;
      this.events.emit({
        type: "lifeGained",
        remainingLives: this.remainingLives,
      });
      return;
    }
  }

  private finishGame(outcome: GameOutcome): void {
    this.gameStatus = outcome;
    this.events.emit({ type: "gameEnded", outcome });
  }

  private startNextLevel(): void {
    this.clearPowerUps();
    this.bricks = this.levelSystem.loadNext();
    this.resetPlayerAndBall();
  }

  private reset(): void {
    this.levelSystem.reset();
    this.clearPowerUps();
    this.resetPlayerAndBall();
  }

  private resetPlayerAndBall(): void {
    this.player.reset();
    this.ball.reset(this.getBallSpawnPosition());
  }

  private clearPowerUps(): void {
    this.powerUps.length = 0;
  }

  private getBallSpawnPosition(): { x: number; y: number } {
    return {
      x: this.player.position.x,
      y: this.player.position.y - this.player.height / 2 - Ball.RADIUS,
    };
  }
}
