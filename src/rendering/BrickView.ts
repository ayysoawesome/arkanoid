import type { GameAssets } from "@/core";
import type { BrickState } from "@/core";
import { Brick, type BrickKind } from "@/entities";
import { AnimatedSprite, Container, Graphics, type Texture } from "pixi.js";
import {
  createSpriteShadow,
  SHADOW_ALPHA,
  SHADOW_COLOR,
  SHADOW_OFFSET,
} from "./Shadow";

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

export class BrickView extends Container {
  private readonly body: Graphics | AnimatedSprite;

  constructor(
    private brick: BrickState,
    assets: GameAssets,
  ) {
    super();
    this.body = this.createBody(assets);
    this.pivot.set(Brick.WIDTH / 2, Brick.HEIGHT / 2);
    const shadow =
      this.body instanceof AnimatedSprite
        ? createSpriteShadow(this.body)
        : new Graphics()
            .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
            .fill(SHADOW_COLOR);
    if (shadow instanceof Graphics) {
      shadow.position.set(SHADOW_OFFSET, SHADOW_OFFSET);
      shadow.alpha = SHADOW_ALPHA;
    }
    this.addChild(shadow, this.body);
    this.sync(brick);
  }

  sync(brick: BrickState): void {
    this.brick = brick;
    this.position.set(this.brick.position.x, this.brick.position.y);
    if (
      this.brick.destroyed &&
      this.body instanceof AnimatedSprite &&
      this.body.playing
    ) {
      this.body.stop();
    }
    this.visible = !this.brick.destroyed;
  }

  playHit(): void {
    if (!(this.body instanceof AnimatedSprite)) return;

    this.visible = true;
    this.body.gotoAndPlay(0);
  }

  private createBody(assets: GameAssets): Graphics | AnimatedSprite {
    if (this.brick.kind === "silver") {
      return this.createMetalBody(assets.brickHitFrames.silver);
    }

    if (this.brick.kind === "gold") {
      return this.createMetalBody(assets.brickHitFrames.gold);
    }

    return new Graphics()
      .rect(0, 0, Brick.WIDTH, Brick.HEIGHT)
      .fill(BRICK_COLORS[this.brick.kind]);
  }

  private createMetalBody(frames: readonly Texture[]): AnimatedSprite {
    const view = new AnimatedSprite({
      textures: [...frames, frames[0]],
      animationSpeed: 0.25,
      loop: false,
    });
    view.onComplete = () => {
      view.gotoAndStop(0);
      this.visible = !this.brick.destroyed;
    };
    return view;
  }
}
