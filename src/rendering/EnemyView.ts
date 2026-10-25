import type { GameAssets } from "@/core";
import type { Enemy } from "@/entities";
import { AnimatedSprite, Container } from "pixi.js";
import { createSpriteShadow } from "./Shadow";

export class EnemyView extends Container {
  private readonly body: AnimatedSprite;

  constructor(
    private readonly enemy: Enemy,
    private readonly assets: GameAssets,
  ) {
    super();
    this.body = new AnimatedSprite({
      textures: assets.enemyFrames[enemy.kind],
      anchor: 0.5,
      animationSpeed: 0.12,
      autoPlay: true,
    });
    this.addChild(createSpriteShadow(this.body), this.body);
    this.sync();
  }

  sync(): void {
    this.position.set(this.enemy.position.x, this.enemy.position.y);
  }

  playExplosion(onComplete: () => void): void {
    this.sync();
    this.body.textures = this.assets.enemyExplosionFrames;
    this.body.animationSpeed = 0.2;
    this.body.loop = false;
    this.body.onComplete = onComplete;
    this.body.gotoAndPlay(0);
  }
}
