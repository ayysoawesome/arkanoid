import { exitBounds, worldConfig } from "@/config";
import { GameAssets } from "@/core";
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

type ColoredBrickKind = Exclude<BrickKind, "silver" | "gold">;

const BRICK_COLORS: Record<ColoredBrickKind, number> = {
  white: 0xf2f2f2,
  orange: 0xff9000,
  "light-blue": 0x00ffff,
  green: 0x00ff00,
  red: 0xff0000,
  blue: 0x0070ff,
  pink: 0xff00ff,
  yellow: 0xffff00,
};

type WorldViewState = {
  readonly player: Player;
  readonly balls: readonly Ball[];
  readonly bricks: readonly Brick[];
  readonly powerUps: readonly PowerUp[];
  readonly laserShots: readonly LaserShot[];
  readonly enemies: readonly Enemy[];
  readonly exitOpen: boolean;
};

export class WorldView extends Container {
  private readonly playerView: AnimatedSprite;
  private readonly laserPlayerView: AnimatedSprite;
  private readonly ballsView = new Container();
  private readonly ballViews = new Map<Ball, Sprite>();
  private renderedPlayerMode: Player["mode"] = "normal";
  private renderedPlayerWidth: "normal" | "expanded" = "normal";
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
  private readonly exitView: Sprite;

  constructor(
    state: WorldViewState,
    private readonly assets: GameAssets,
  ) {
    super();

    const fieldView = new Sprite(assets.field1);
    fieldView.anchor.set(0, 0);
    fieldView.position.set(0, 0);
    fieldView.setSize(worldConfig.width, worldConfig.height);

    this.exitView = new Sprite(assets.exit);
    this.exitView.position.set(exitBounds.left, exitBounds.top);
    this.exitView.setSize(worldConfig.exit.width, worldConfig.exit.height);

    this.playerView = new AnimatedSprite({
      textures: assets.normalLights,
      anchor: 0.5,
      animationSpeed: 0.1,
      autoPlay: true,
    });

    this.laserPlayerView = new AnimatedSprite({
      textures: [assets.normalLights[0], ...assets.laserTransform],
      anchor: 0.5,
      animationSpeed: 0.2,
      loop: false,
    });
    this.laserPlayerView.visible = false;

    this.addChild(
      fieldView,
      this.exitView,
      this.bricksView,
      this.enemiesView,
      this.enemyEffectsView,
      this.powerUpsView,
      this.laserShotsView,
      this.playerView,
      this.laserPlayerView,
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
  }: WorldViewState): void {
    this.exitView.visible = exitOpen;
    this.syncPlayer(player);
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

  private syncPlayer(player: Player) {
    if (player.mode !== this.renderedPlayerMode) {
      this.renderedPlayerMode = player.mode;
      this.playerView.visible = player.mode !== "laser";
      this.laserPlayerView.visible = player.mode === "laser";

      if (player.mode === "laser") {
        this.playerView.stop();
        this.laserPlayerView.textures = [
          this.assets.normalLights[0],
          ...this.assets.laserTransform,
        ];
        this.laserPlayerView.animationSpeed = 0.2;
        this.laserPlayerView.loop = false;
        this.laserPlayerView.onComplete = () => {
          if (this.renderedPlayerMode !== "laser") return;

          this.laserPlayerView.textures = this.assets.laserLights;
          this.laserPlayerView.animationSpeed = 0.1;
          this.laserPlayerView.loop = true;
          this.laserPlayerView.gotoAndPlay(0);
        };
        this.laserPlayerView.gotoAndPlay(0);
      } else {
        this.laserPlayerView.stop();
        this.laserPlayerView.onComplete = undefined;
        this.playerView.gotoAndPlay(0);
      }
    }

    if (player.mode !== "laser") {
      const nextPlayerWidth = player.width >= 40 ? "expanded" : "normal";
      if (nextPlayerWidth !== this.renderedPlayerWidth) {
        this.renderedPlayerWidth = nextPlayerWidth;
        this.playerView.textures =
          nextPlayerWidth === "expanded"
            ? this.assets.expandedLights
            : this.assets.normalLights;
        this.playerView.gotoAndPlay(0);
      }
    }

    if (
      this.playerView.width !== player.width ||
      this.playerView.height !== player.height
    ) {
      this.playerView.setSize(player.width, player.height);
    }
    if (
      this.laserPlayerView.width !== player.width ||
      this.laserPlayerView.height !== player.height
    ) {
      this.laserPlayerView.setSize(player.width, player.height);
    }
    this.playerView.position.set(player.position.x, player.position.y);
    this.laserPlayerView.position.set(player.position.x, player.position.y);
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
