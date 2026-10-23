import { worldConfig } from "@/config";
import {
  Ball,
  Brick,
  LaserShot,
  Player,
  PowerUp,
  type PowerUpKind,
} from "@/entities";
import {
  BallPhysicsSystem,
  BrickSystem,
  LaserSystem,
  LevelSystem,
  PlayerControlSystem,
  PowerUpSystem,
} from "@/systems";
import { EventQueue } from "./EventQueue";
import type { GameOutcome, WorldEvent } from "./WorldEvent";

type GameStatus = "playing" | GameOutcome;
const SLOW_FACTOR = 0.75;
const MAX_BALLS = 3;
const DISRUPT_ANGLE = (20 * Math.PI) / 180;

export class GameWorld {
  readonly player = new Player();
  readonly balls: Ball[] = [];
  bricks: Brick[] = [];
  readonly powerUps: PowerUp[] = [];
  readonly laserShots: LaserShot[] = [];
  private readonly events = new EventQueue<WorldEvent>();
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem(this.events);
  private readonly brickSystem = new BrickSystem(this.events);
  private readonly powerUpSystem = new PowerUpSystem(this.events);
  private readonly laserSystem = new LaserSystem(this.events);
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
    actionPressed,
    dtSeconds,
  }: {
    direction: number;
    actionPressed: boolean;
    dtSeconds: number;
  }): void {
    if (this.gameStatus !== "playing") return;
    const hadAttachedBall = this.balls.some((ball) => ball.attached);
    this.playerControl.update({ player: this.player, direction, dtSeconds });

    for (const ball of this.balls) {
      this.ballPhysics.update({
        player: this.player,
        ball,
        launchRequested: actionPressed,
        dtSeconds,
        bricks: this.bricks,
      });
    }
    this.removeLostBalls();
    this.events.flush();
    this.laserSystem.update({
      shots: this.laserShots,
      player: this.player,
      bricks: this.bricks,
      fireRequested: actionPressed && !hadAttachedBall && this.balls.length > 0,
      dtSeconds,
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
    if (this.balls.length === 0) {
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

    this.resetPlayerAndBalls();
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

    if (kind === "laser") {
      this.player.enableLaser();
      return;
    }

    if (kind === "slow") {
      for (const ball of this.balls) {
        ball.setSpeed(ball.currentSpeed * SLOW_FACTOR);
      }
      return;
    }

    if (kind === "disrupt") {
      this.splitBall();
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
    this.clearLaserShots();
    this.events.emit({ type: "gameEnded", outcome });
  }

  private startNextLevel(): void {
    this.clearPowerUps();
    this.bricks = this.levelSystem.loadNext();
    this.resetPlayerAndBalls();
  }

  private reset(): void {
    this.levelSystem.reset();
    this.clearPowerUps();
    this.resetPlayerAndBalls();
  }

  private resetPlayerAndBalls(): void {
    this.clearLaserShots();
    this.player.reset();
    this.balls.length = 0;
    this.balls.push(new Ball(this.getBallSpawnPosition()));
  }

  private splitBall(): void {
    if (this.balls.length >= MAX_BALLS) return;

    const source = this.balls.find((ball) => !ball.attached) ?? this.balls[0];
    if (!source) return;

    for (const angle of [-DISRUPT_ANGLE, DISRUPT_ANGLE]) {
      if (this.balls.length >= MAX_BALLS) break;
      this.balls.push(source.spawnSplitCopy(angle));
    }
  }

  private removeLostBalls(): void {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      if (!this.balls[i].alive) {
        this.balls.splice(i, 1);
      }
    }
  }

  private clearPowerUps(): void {
    this.powerUps.length = 0;
  }

  private clearLaserShots(): void {
    this.laserShots.length = 0;
    this.laserSystem.reset();
  }

  private getBallSpawnPosition(): { x: number; y: number } {
    return {
      x: this.player.position.x,
      y: this.player.position.y - this.player.height / 2 - Ball.RADIUS,
    };
  }
}
