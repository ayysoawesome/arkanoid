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
  private readonly pausedAnimations = new Set<AnimatedSprite>();
  private animationsPaused = false;
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
    if (this.animationsPaused) this.pausePlayingAnimations();
  }

  private syncViews<State extends { id: number }, View extends Container>(
    states: readonly State[],
    views: Map<number, View>,
    layer: Container,
    create: (state: State) => View,
    update: (view: View, state: State) => void,
  ): void {
    const currentIds = new Set(states.map((state) => state.id));

    for (const [id, view] of views) {
      if (currentIds.has(id)) continue;

      layer.removeChild(view);
      view.destroy({ children: true });
      views.delete(id);
    }

    for (const state of states) {
      let view = views.get(state.id);
      if (!view) {
        view = create(state);
        layer.addChild(view);
        views.set(state.id, view);
      }
      update(view, state);
    }
  }

  private syncEnemies(enemies: readonly EnemyState[]): void {
    this.syncViews(
      enemies,
      this.enemyViews,
      this.enemiesView,
      (enemy) => new EnemyView(enemy, this.assets),
      (view, enemy) => view.sync(enemy),
    );
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
    this.animationsPaused = paused;
    if (paused) {
      this.pausePlayingAnimations();
    } else {
      this.pausedAnimations.forEach((view) => {
        if (!view.destroyed) view.play();
      });
      this.pausedAnimations.clear();
    }
  }

  private pausePlayingAnimations(): void {
    this.collectPlayingAnimations(this);
  }

  private collectPlayingAnimations(container: Container): void {
    for (const child of container.children) {
      if (child instanceof AnimatedSprite && child.playing) {
        this.pausedAnimations.add(child);
        child.stop();
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
    this.syncViews(
      laserShots,
      this.laserShotViews,
      this.laserShotsView,
      () => createShadowedSprite(this.assets.laserShot),
      (view, shot) => view.position.set(shot.position.x, shot.position.y),
    );
  }

  private syncPowerUps(powerUps: readonly PowerUpState[]): void {
    this.syncViews(
      powerUps,
      this.powerUpViews,
      this.powerUpsView,
      (powerUp) => {
        const body = new AnimatedSprite({
          textures: this.assets.powerUps[powerUp.kind],
          anchor: 0.5,
          animationSpeed: 0.15,
          autoPlay: true,
        });
        const view = new Container();
        view.addChild(createSpriteShadow(body), body);
        return view;
      },
      (view, powerUp) =>
        view.position.set(powerUp.position.x, powerUp.position.y),
    );
  }

  private syncBricks(bricks: readonly BrickState[]): void {
    this.syncViews(
      bricks,
      this.brickViews,
      this.bricksView,
      (brick) => new BrickView(brick, this.assets),
      (view, brick) => view.sync(brick),
    );
  }

  private syncBalls(balls: readonly BallState[]): void {
    this.syncViews(
      balls,
      this.ballViews,
      this.ballsView,
      () => createShadowedSprite(this.assets.ball),
      (view, ball) => view.position.set(ball.position.x, ball.position.y),
    );
  }
}
