import {
  GameAssets,
  type BallState,
  type BrickState,
  type EnemyState,
  type LaserShotState,
  type PowerUpState,
  type WorldState,
} from "@/core";
import { AnimatedSprite, Container } from "pixi.js";
import { BrickView } from "./BrickView";
import { EnemyView } from "./EnemyView";
import { FieldView } from "./FieldView";
import { PlayerView } from "./PlayerView";
import { createShadowedSprite, createSpriteShadow } from "./Shadow";

export class WorldView extends Container {
  private readonly playerView: PlayerView;
  private readonly ballsView = new Container();
  private readonly ballViews = new Map<number, Container>();
  private bricksView = new Container();
  private readonly brickViews = new Map<number, BrickView>();
  private readonly powerUpsView = new Container();
  private readonly powerUpViews = new Map<number, Container>();
  private readonly laserShotsView = new Container();
  private readonly laserShotViews = new Map<number, Container>();
  private readonly enemiesView = new Container();
  private readonly enemyViews = new Map<number, EnemyView>();
  private readonly enemyEffectsView = new Container();
  private readonly enemyEffects = new Set<EnemyView>();
  private pausedAnimations: AnimatedSprite[] = [];
  private readonly fieldView: FieldView;

  constructor(
    state: WorldState,
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
    status,
  }: WorldState): void {
    this.fieldView.setExitOpen(exitOpen);
    this.fieldView.setGateFrames(gateFrames);
    this.playerView.sync(player, playerPhaseFrame, status === "defeat");
    this.ballsView.visible = playerPhaseFrame === null;
    this.syncBalls(balls);
    this.syncBricks(bricks);
    this.syncPowerUps(powerUps);
    this.syncLaserShots(laserShots);
    this.syncEnemies(enemies);
  }

  private syncEnemies(enemies: readonly EnemyState[]): void {
    const currentEnemies = new Set(enemies.map((enemy) => enemy.id));

    for (const [id, view] of this.enemyViews) {
      if (currentEnemies.has(id)) continue;
      this.enemiesView.removeChild(view);
      view.destroy({ children: true });
      this.enemyViews.delete(id);
    }

    for (const enemy of enemies) {
      let view = this.enemyViews.get(enemy.id);
      if (!view) {
        view = new EnemyView(enemy, this.assets);
        this.enemiesView.addChild(view);
        this.enemyViews.set(enemy.id, view);
      }
      view.sync(enemy);
    }
  }

  playEnemyExplosion(enemy: EnemyState): void {
    let view = this.enemyViews.get(enemy.id);
    if (view) {
      this.enemiesView.removeChild(view);
      this.enemyViews.delete(enemy.id);
    } else {
      view = new EnemyView(enemy, this.assets);
    }

    this.enemyEffectsView.addChild(view);
    this.enemyEffects.add(view);
    view.playExplosion(enemy, () => {
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

  playBrickHit(brickId: number): void {
    this.brickViews.get(brickId)?.playHit();
  }

  private syncLaserShots(laserShots: readonly LaserShotState[]): void {
    const currentShots = new Set(laserShots.map((shot) => shot.id));

    for (const [id, view] of this.laserShotViews) {
      if (currentShots.has(id)) continue;

      this.laserShotsView.removeChild(view);
      view.destroy({ children: true });
      this.laserShotViews.delete(id);
    }

    for (const shot of laserShots) {
      let view = this.laserShotViews.get(shot.id);

      if (!view) {
        view = createShadowedSprite(this.assets.laserShot);
        this.laserShotsView.addChild(view);
        this.laserShotViews.set(shot.id, view);
      }

      view.position.set(shot.position.x, shot.position.y);
    }
  }

  private syncPowerUps(powerUps: readonly PowerUpState[]): void {
    const currentPowerUps = new Set(powerUps.map((powerUp) => powerUp.id));

    for (const [id, view] of this.powerUpViews) {
      if (currentPowerUps.has(id)) continue;

      this.powerUpsView.removeChild(view);
      view.destroy({ children: true });
      this.powerUpViews.delete(id);
    }

    for (const powerUp of powerUps) {
      let view = this.powerUpViews.get(powerUp.id);

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
        this.powerUpViews.set(powerUp.id, view);
      }

      view.position.set(powerUp.position.x, powerUp.position.y);
    }
  }

  private syncBricks(bricks: readonly BrickState[]): void {
    const currentBricks = new Set(bricks.map((brick) => brick.id));

    for (const [id, view] of this.brickViews) {
      if (currentBricks.has(id)) continue;

      this.bricksView.removeChild(view);
      view.destroy({ children: true });
      this.brickViews.delete(id);
    }

    for (const brick of bricks) {
      let view = this.brickViews.get(brick.id);

      if (!view) {
        view = new BrickView(brick, this.assets);
        this.bricksView.addChild(view);
        this.brickViews.set(brick.id, view);
      }

      view.sync(brick);
    }
  }

  private syncBalls(balls: readonly BallState[]): void {
    const currentBalls = new Set(balls.map((ball) => ball.id));

    for (const [id, view] of this.ballViews) {
      if (currentBalls.has(id)) continue;

      this.ballsView.removeChild(view);
      view.destroy({ children: true });
      this.ballViews.delete(id);
    }

    for (const ball of balls) {
      let view = this.ballViews.get(ball.id);

      if (!view) {
        view = createShadowedSprite(this.assets.ball);
        this.ballsView.addChild(view);
        this.ballViews.set(ball.id, view);
      }

      view.position.set(ball.position.x, ball.position.y);
    }
  }
}
