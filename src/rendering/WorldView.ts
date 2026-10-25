import { GameAssets, type PlayerPhaseFrame } from "@/core";
import type { EnemyGateFrame, EnemyGateSide } from "@/config";
import {
  Ball,
  Brick,
  BrickKind,
  Enemy,
  LaserShot,
  Player,
  PowerUp,
} from "@/entities";
import { AnimatedSprite, Container, Graphics, Sprite, Texture } from "pixi.js";
import { FieldView } from "./FieldView";
import { PlayerView } from "./PlayerView";

type ColoredBrickKind = Exclude<BrickKind, "silver" | "gold">;

const BRICK_COLORS: Record<ColoredBrickKind, number> = {
  white: 0xffffff,
  orange: 0xff8473,
  "light-blue": 0x63adff,
  green: 0x8cd600,
  red: 0xb53121,
  blue: 0x1863d6,
  pink: 0xff6bce,
  yellow: 0xe79c21,
};

type WorldViewState = {
  readonly player: Player;
  readonly balls: readonly Ball[];
  readonly bricks: readonly Brick[];
  readonly powerUps: readonly PowerUp[];
  readonly laserShots: readonly LaserShot[];
  readonly enemies: readonly Enemy[];
  readonly exitOpen: boolean;
  readonly gateFrames: Readonly<Record<EnemyGateSide, EnemyGateFrame>>;
  readonly playerPhaseFrame: PlayerPhaseFrame | null;
  readonly playerDefeated: boolean;
};

export class WorldView extends Container {
  private readonly playerView: PlayerView;
  private readonly ballsView = new Container();
  private readonly ballViews = new Map<Ball, Sprite>();
  private bricksView = new Container();
  private readonly brickViews = new Map<Brick, Graphics | Sprite>();
  private readonly powerUpsView = new Container();
  private readonly powerUpViews = new Map<PowerUp, AnimatedSprite>();
  private readonly laserShotsView = new Container();
  private readonly laserShotViews = new Map<LaserShot, Sprite>();
  private readonly enemiesView = new Container();
  private readonly enemyViews = new Map<Enemy, AnimatedSprite>();
  private readonly enemyEffectsView = new Container();
  private readonly enemyEffects = new Set<AnimatedSprite>();
  private pausedAnimations: AnimatedSprite[] = [];
  private readonly fieldView: FieldView;

  constructor(
    state: WorldViewState,
    private readonly assets: GameAssets,
  ) {
    super();

    this.fieldView = new FieldView(assets.field);

    this.playerView = new PlayerView(assets);

    this.addChild(
      this.fieldView,
      this.bricksView,
      this.enemiesView,
      this.enemyEffectsView,
      this.powerUpsView,
      this.laserShotsView,
      this.playerView,
      this.ballsView,
    );
    this.sync(state);
  }

  sync({
    player,
    balls,
    bricks,
    powerUps,
    laserShots,
    enemies,
    exitOpen,
    gateFrames,
    playerPhaseFrame,
    playerDefeated,
  }: WorldViewState): void {
    this.fieldView.setExitOpen(exitOpen);
    this.fieldView.setGateFrames(gateFrames);
    this.playerView.sync(player, playerPhaseFrame, playerDefeated);
    this.ballsView.visible = playerPhaseFrame === null;
    this.syncBalls(balls);
    this.syncBricks(bricks);
    this.syncPowerUps(powerUps);
    this.syncLaserShots(laserShots);
    this.syncEnemies(enemies);
  }

  private syncEnemies(enemies: readonly Enemy[]): void {
    const currentEnemies = new Set(enemies);

    for (const [enemy, view] of this.enemyViews) {
      if (currentEnemies.has(enemy)) continue;
      this.enemiesView.removeChild(view);
      view.destroy();
      this.enemyViews.delete(enemy);
    }

    for (const enemy of enemies) {
      let view = this.enemyViews.get(enemy);
      if (!view) {
        view = new AnimatedSprite({
          textures: this.assets.enemyFrames[enemy.kind],
          anchor: 0.5,
          animationSpeed: 0.12,
          autoPlay: true,
        });
        this.enemiesView.addChild(view);
        this.enemyViews.set(enemy, view);
      }
      view.position.set(enemy.position.x, enemy.position.y);
    }
  }

  playEnemyExplosion(position: Readonly<{ x: number; y: number }>): void {
    const view = new AnimatedSprite({
      textures: this.assets.enemyExplosionFrames,
      anchor: 0.5,
      animationSpeed: 0.2,
      loop: false,
    });
    view.position.set(position.x, position.y);
    view.onComplete = () => {
      this.enemyEffectsView.removeChild(view);
      this.enemyEffects.delete(view);
      view.destroy();
    };
    this.enemyEffectsView.addChild(view);
    this.enemyEffects.add(view);
    view.play();
  }

  clearEnemyExplosions(): void {
    for (const view of this.enemyEffects) {
      this.enemyEffectsView.removeChild(view);
      view.destroy();
    }
    this.enemyEffects.clear();
  }

  setPaused(paused: boolean): void {
    if (paused) {
      this.pausedAnimations = [];
      this.collectPlayingAnimations(this);
      this.pausedAnimations.forEach((view) => view.stop());
    } else {
      this.pausedAnimations.forEach((view) => view.play());
      this.pausedAnimations = [];
    }
  }

  private collectPlayingAnimations(container: Container): void {
    for (const child of container.children) {
      if (child instanceof AnimatedSprite && child.playing) {
        this.pausedAnimations.push(child);
      }
      if (child instanceof Container) {
        this.collectPlayingAnimations(child);
      }
    }
  }

  playBrickHit(brick: Brick): void {
    const view = this.brickViews.get(brick);
    if (!(view instanceof AnimatedSprite)) return;

    view.visible = true;
    view.gotoAndPlay(0);
  }

  private syncLaserShots(laserShots: readonly LaserShot[]): void {
    const currentShots = new Set(laserShots);

    for (const [shot, view] of this.laserShotViews) {
      if (currentShots.has(shot)) continue;

      this.laserShotsView.removeChild(view);
      view.destroy();
      this.laserShotViews.delete(shot);
    }

    for (const shot of laserShots) {
      let view = this.laserShotViews.get(shot);

      if (!view) {
        view = new Sprite(this.assets.laserShot);
        view.anchor.set(0.5);
        this.laserShotsView.addChild(view);
        this.laserShotViews.set(shot, view);
      }

      view.position.set(shot.position.x, shot.position.y);
    }
  }

  private syncPowerUps(powerUps: readonly PowerUp[]): void {
    const currentPowerUps = new Set(powerUps);

    for (const [powerUp, view] of this.powerUpViews) {
      if (currentPowerUps.has(powerUp)) continue;

      this.powerUpsView.removeChild(view);
      view.destroy();
      this.powerUpViews.delete(powerUp);
    }

    for (const powerUp of powerUps) {
      let view = this.powerUpViews.get(powerUp);

      if (!view) {
        view = new AnimatedSprite({
          textures: this.assets.powerUps[powerUp.kind],
          anchor: 0.5,
          animationSpeed: 0.15,
          autoPlay: true,
        });
        this.powerUpsView.addChild(view);
        this.powerUpViews.set(powerUp, view);
      }

      view.position.set(powerUp.position.x, powerUp.position.y);
    }
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
        view.pivot.set(Brick.WIDTH / 2, Brick.HEIGHT / 2);
        this.bricksView.addChild(view);
        this.brickViews.set(brick, view);
      }

      view.position.set(brick.position.x, brick.position.y);
      if (brick.destroyed && view instanceof AnimatedSprite && view.playing) {
        view.stop();
      }
      view.visible = !brick.destroyed;
    }
  }

  private syncBalls(balls: readonly Ball[]): void {
    const currentBalls = new Set(balls);

    for (const [ball, view] of this.ballViews) {
      if (currentBalls.has(ball)) continue;

      this.ballsView.removeChild(view);
      view.destroy();
      this.ballViews.delete(ball);
    }

    for (const ball of balls) {
      let view = this.ballViews.get(ball);

      if (!view) {
        view = new Sprite(this.assets.ball);
        view.anchor.set(0.5);
        this.ballsView.addChild(view);
        this.ballViews.set(ball, view);
      }

      view.position.set(ball.position.x, ball.position.y);
    }
  }

  private createBrickView(brick: Brick, assets: GameAssets) {
    if (brick.kind === "silver") {
      return this.createMetalBrickView(brick, assets.brickHitFrames.silver);
    }

    if (brick.kind === "gold") {
      return this.createMetalBrickView(brick, assets.brickHitFrames.gold);
    }

    return new Graphics()
      .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
      .fill(BRICK_COLORS[brick.kind]);
  }

  private createMetalBrickView(
    brick: Brick,
    frames: readonly Texture[],
  ): AnimatedSprite {
    const view = new AnimatedSprite({
      textures: [...frames, frames[0]],
      animationSpeed: 0.25,
      loop: false,
    });
    view.onComplete = () => {
      view.gotoAndStop(0);
      view.visible = !brick.destroyed;
    };
    return view;
  }
}
