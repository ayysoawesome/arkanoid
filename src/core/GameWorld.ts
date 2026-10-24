import { exitBounds, fieldBounds, worldConfig } from "@/config";
import {
  Ball,
  Brick,
  Enemy,
  LaserShot,
  Player,
  PowerUp,
  type PowerUpKind,
} from "@/entities";
import {
  BallPhysicsSystem,
  BrickSystem,
  EnemySystem,
  LaserSystem,
  LevelSystem,
  PlayerControlSystem,
  PowerUpSystem,
  ScoreSystem,
} from "@/systems";
import { EventQueue } from "./EventQueue";
import type { GameOutcome, WorldEvent } from "./WorldEvent";

type GameStatus = "playing" | GameOutcome;
const SLOW_FACTOR = 0.75;
const MAX_BALLS = 3;
const DISRUPT_ANGLE = (20 * Math.PI) / 180;
const SPAWN_FRAME_DURATION_SECONDS = 0.12;
const SPAWN_FRAME_COUNT = 5;

export class GameWorld {
  readonly player = new Player();
  readonly balls: Ball[] = [];
  bricks: Brick[] = [];
  readonly powerUps: PowerUp[] = [];
  readonly laserShots: LaserShot[] = [];
  readonly enemies: Enemy[] = [];
  private readonly events = new EventQueue<WorldEvent>();
  private readonly playerControl = new PlayerControlSystem();
  private readonly ballPhysics = new BallPhysicsSystem(this.events);
  private readonly brickSystem = new BrickSystem(this.events);
  private readonly enemySystem = new EnemySystem(this.events);
  private readonly powerUpSystem = new PowerUpSystem(this.events);
  private readonly laserSystem = new LaserSystem(this.events);
  private readonly levelSystem = new LevelSystem();
  private readonly scoreSystem = new ScoreSystem(this.events);
  private remainingLives = worldConfig.initialLives;
  private gameStatus: GameStatus = "playing";
  private exitIsOpen = false;
  private spawnElapsedSeconds: number | null = null;

  constructor() {
    this.events.subscribe(this.handleEvent);
    this.startCampaign();
  }

  onEvent(listener: (event: WorldEvent) => void): () => void {
    return this.events.subscribe(listener);
  }

  update({
    direction,
    targetX,
    actionPressed,
    dtSeconds,
  }: {
    direction: number;
    targetX: number | null;
    actionPressed: boolean;
    dtSeconds: number;
  }): void {
    if (this.gameStatus !== "playing") return;
    if (this.spawnElapsedSeconds !== null) {
      this.spawnElapsedSeconds += dtSeconds;
      if (
        this.spawnElapsedSeconds >=
        SPAWN_FRAME_DURATION_SECONDS * SPAWN_FRAME_COUNT
      ) {
        this.spawnElapsedSeconds = null;
      }
      return;
    }
    const hadAttachedBall = this.balls.some((ball) => ball.attached);
    this.player.update(dtSeconds);
    this.playerControl.update({
      player: this.player,
      direction,
      targetX,
      dtSeconds,
      rightBoundary: this.exitIsOpen ? exitBounds.right : fieldBounds.right,
    });

    this.enemySystem.update(this.enemies, this.player, this.bricks, dtSeconds);

    for (const ball of this.balls) {
      this.ballPhysics.update({
        player: this.player,
        ball,
        launchRequested: actionPressed,
        dtSeconds,
        bricks: this.bricks,
        enemies: this.enemies,
      });
    }
    this.removeLostBalls();
    this.events.flush();
    this.removeDestroyedEnemies();
    this.laserSystem.update({
      shots: this.laserShots,
      player: this.player,
      bricks: this.bricks,
      enemies: this.enemies,
      fireRequested: actionPressed && !hadAttachedBall && this.balls.length > 0,
      dtSeconds,
    });
    this.events.flush();
    this.removeDestroyedEnemies();
    this.powerUpSystem.update({
      powerUpArr: this.powerUps,
      dtSeconds,
      player: this.player,
    });
    this.events.flush();
    if (this.levelSystem.isCleared(this.bricks)) {
      this.completeLevel("cleared");
      return;
    }
    if (
      this.exitIsOpen &&
      this.player.position.x + this.player.width / 2 >= exitBounds.right
    ) {
      this.completeLevel("exited");
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

  get score(): number {
    return this.scoreSystem.score;
  }

  get currentLevelIndex(): number {
    return this.levelSystem.currentLevelIndex;
  }

  get status(): GameStatus {
    return this.gameStatus;
  }

  get exitOpen(): boolean {
    return this.exitIsOpen;
  }

  get playerSpawnFrame(): number | null {
    if (this.spawnElapsedSeconds === null) return null;
    return Math.min(
      SPAWN_FRAME_COUNT - 1,
      Math.floor(this.spawnElapsedSeconds / SPAWN_FRAME_DURATION_SECONDS),
    );
  }

  private startCampaign() {
    this.reset();
    if (!this.levelSystem.hasNextLevel()) {
      throw new Error("Campaign has no first level");
    }

    this.bricks = this.levelSystem.loadNext();
    this.enemySystem.startLevel(this.levelSystem.getEnemySpawns());
    this.events.emit({
      type: "levelStarted",
      levelIndex: this.levelSystem.currentLevelIndex,
    });
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

    this.enemies.length = 0;
    this.enemySystem.startLevel(this.levelSystem.getEnemySpawns());
    this.resetPlayerAndBalls();
  }

  private readonly handleEvent = (event: WorldEvent): void => {
    if (event.type === "brickHit") {
      this.brickSystem.handleHit(event.brick);
    }

    if (event.type === "brickDestroyed") {
      this.scoreSystem.awardBrick(
        event.brickKind,
        this.levelSystem.currentLevelIndex,
      );
      this.powerUpSystem.handleBrickDestroyed(event, this.powerUps);
    }

    if (event.type === "enemyHit") {
      this.enemySystem.handleHit(event.enemy);
    }

    if (event.type === "enemyDestroyed") {
      this.scoreSystem.awardEnemy();
    }

    if (event.type === "powerUpCollected") {
      this.scoreSystem.awardCapsule();
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

    if (kind === "break") {
      this.exitIsOpen = true;
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
    this.exitIsOpen = false;
    this.clearLaserShots();
    this.events.emit({ type: "gameEnded", outcome });
  }

  private completeLevel(reason: "cleared" | "exited"): void {
    this.events.emit({
      type: reason === "cleared" ? "levelCleared" : "levelExited",
      levelIndex: this.levelSystem.currentLevelIndex,
    });

    if (this.levelSystem.hasNextLevel()) {
      this.startNextLevel();
    } else {
      this.finishGame("victory");
    }
    this.events.flush();
  }

  private startNextLevel(): void {
    this.clearPowerUps();
    this.enemies.length = 0;
    this.bricks = this.levelSystem.loadNext();
    this.enemySystem.startLevel(this.levelSystem.getEnemySpawns());
    this.resetPlayerAndBalls();
    this.events.emit({
      type: "levelStarted",
      levelIndex: this.levelSystem.currentLevelIndex,
    });
  }

  private reset(): void {
    this.levelSystem.reset();
    this.scoreSystem.reset();
    this.clearPowerUps();
    this.enemies.length = 0;
    this.resetPlayerAndBalls();
  }

  private resetPlayerAndBalls(): void {
    this.clearLaserShots();
    this.exitIsOpen = false;
    this.player.reset();
    this.balls.length = 0;
    this.balls.push(new Ball(this.getBallSpawnPosition()));
    this.spawnElapsedSeconds = 0;
  }

  private removeDestroyedEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].alive) this.enemies.splice(i, 1);
    }
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
