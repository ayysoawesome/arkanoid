import { GameAssets, type PlayerPhaseFrame } from "@/core";
import type { EnemyGateFrame, EnemyGateSide } from "@/config";
import { Ball, Brick, Enemy, LaserShot, Player, PowerUp } from "@/entities";
import { AnimatedSprite, Container } from "pixi.js";
import { BrickView } from "./BrickView";
import { EnemyView } from "./EnemyView";
import { FieldView } from "./FieldView";
import { PlayerView } from "./PlayerView";
import { createShadowedSprite, createSpriteShadow } from "./Shadow";

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
  private readonly ballViews = new Map<Ball, Container>();
  private bricksView = new Container();
  private readonly brickViews = new Map<Brick, BrickView>();
  private readonly powerUpsView = new Container();
  private readonly powerUpViews = new Map<PowerUp, Container>();
  private readonly laserShotsView = new Container();
  private readonly laserShotViews = new Map<LaserShot, Container>();
  private readonly enemiesView = new Container();
  private readonly enemyViews = new Map<Enemy, EnemyView>();
  private readonly enemyEffectsView = new Container();
  private readonly enemyEffects = new Set<EnemyView>();
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
      view.destroy({ children: true });
      this.enemyViews.delete(enemy);
    }

    for (const enemy of enemies) {
      let view = this.enemyViews.get(enemy);
      if (!view) {
        view = new EnemyView(enemy, this.assets);
        this.enemiesView.addChild(view);
        this.enemyViews.set(enemy, view);
      }
      view.sync();
    }
  }

  playEnemyExplosion(enemy: Enemy): void {
    let view = this.enemyViews.get(enemy);
    if (view) {
      this.enemiesView.removeChild(view);
      this.enemyViews.delete(enemy);
    } else {
      view = new EnemyView(enemy, this.assets);
    }

    this.enemyEffectsView.addChild(view);
    this.enemyEffects.add(view);
    view.playExplosion(() => {
      this.enemyEffectsView.removeChild(view);
      this.enemyEffects.delete(view);
      view.destroy({ children: true });
    });
  }

  clearEnemyExplosions(): void {
    for (const view of this.enemyEffects) {
      this.enemyEffectsView.removeChild(view);
      view.destroy({ children: true });
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
    this.brickViews.get(brick)?.playHit();
  }

  private syncLaserShots(laserShots: readonly LaserShot[]): void {
    const currentShots = new Set(laserShots);

    for (const [shot, view] of this.laserShotViews) {
      if (currentShots.has(shot)) continue;

      this.laserShotsView.removeChild(view);
      view.destroy({ children: true });
      this.laserShotViews.delete(shot);
    }

    for (const shot of laserShots) {
      let view = this.laserShotViews.get(shot);

      if (!view) {
        view = createShadowedSprite(this.assets.laserShot);
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
      view.destroy({ children: true });
      this.powerUpViews.delete(powerUp);
    }

    for (const powerUp of powerUps) {
      let view = this.powerUpViews.get(powerUp);

      if (!view) {
        const body = new AnimatedSprite({
          textures: this.assets.powerUps[powerUp.kind],
          anchor: 0.5,
          animationSpeed: 0.15,
          autoPlay: true,
        });
        view = new Container();
        view.addChild(createSpriteShadow(body), body);
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
      view.destroy({ children: true });
      this.brickViews.delete(brick);
    }

    for (const brick of bricks) {
      let view = this.brickViews.get(brick);

      if (!view) {
        view = new BrickView(brick, this.assets);
        this.bricksView.addChild(view);
        this.brickViews.set(brick, view);
      }

      view.sync();
    }
  }

  private syncBalls(balls: readonly Ball[]): void {
    const currentBalls = new Set(balls);

    for (const [ball, view] of this.ballViews) {
      if (currentBalls.has(ball)) continue;

      this.ballsView.removeChild(view);
      view.destroy({ children: true });
      this.ballViews.delete(ball);
    }

    for (const ball of balls) {
      let view = this.ballViews.get(ball);

      if (!view) {
        view = createShadowedSprite(this.assets.ball);
        this.ballsView.addChild(view);
        this.ballViews.set(ball, view);
      }

      view.position.set(ball.position.x, ball.position.y);
    }
  }
}
