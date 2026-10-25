import { playerAnimationConfig } from "@/config";
import type { GameAssets, PlayerPhaseFrame, PlayerState } from "@/core";
import { Player } from "@/entities";
import { AnimatedSprite, Container, Sprite } from "pixi.js";
import { createSpriteShadow } from "./Shadow";

type PlayerWidth = "normal" | "expanded";
const EXPANDED_SPRITE_WIDTH_THRESHOLD =
  (Player.NORMAL_WIDTH + Player.EXPANDED_WIDTH) / 2;

export class PlayerView extends Container {
  private readonly body: AnimatedSprite;
  private readonly bodyShadow: Sprite;
  private readonly phaseSprite: Sprite;
  private readonly phaseShadow: Sprite;
  private renderedMode: PlayerState["mode"] = "normal";
  private renderedWidth: PlayerWidth = "normal";

  constructor(private readonly assets: GameAssets) {
    super();
    this.body = new AnimatedSprite({
      textures: assets.normalLights,
      anchor: 0.5,
      animationSpeed: playerAnimationConfig.normalLights.animationSpeed,
      autoPlay: true,
    });
    this.phaseSprite = new Sprite(assets.playerSpawnFrames[0]);
    this.phaseSprite.anchor.set(0.5);
    this.phaseSprite.visible = false;
    this.bodyShadow = createSpriteShadow(this.body);
    this.phaseShadow = createSpriteShadow(this.phaseSprite);
    this.phaseShadow.visible = false;
    this.addChild(
      this.bodyShadow,
      this.phaseShadow,
      this.body,
      this.phaseSprite,
    );
  }

  sync(
    player: PlayerState,
    phase: PlayerPhaseFrame | null,
    defeated: boolean,
  ): void {
    const width =
      player.width >= EXPANDED_SPRITE_WIDTH_THRESHOLD ? "expanded" : "normal";
    if (player.mode !== this.renderedMode) {
      this.renderedMode = player.mode;
      if (player.mode === "laser") {
        this.playLaserTransform();
      } else {
        this.playNormalClip(width);
      }
    } else if (player.mode !== "laser" && width !== this.renderedWidth) {
      this.playNormalClip(width);
    }

    if (
      this.body.width !== player.width ||
      this.body.height !== player.height
    ) {
      this.body.setSize(player.width, player.height);
      this.bodyShadow.setSize(player.width, player.height);
    }
    this.position.set(player.position.x, player.position.y);
    this.body.visible = phase === null && !defeated;
    this.bodyShadow.visible = this.body.visible;
    this.phaseSprite.visible = phase !== null;
    this.phaseShadow.visible = this.phaseSprite.visible;
    if (phase !== null) {
      this.phaseSprite.texture =
        phase.kind === "spawn"
          ? this.assets.playerSpawnFrames[phase.frame]
          : this.assets.playerDestroyFrames[phase.frame];
      this.phaseShadow.texture = this.phaseSprite.texture;
    }
  }

  private playNormalClip(width: PlayerWidth): void {
    this.renderedWidth = width;
    const key = width === "expanded" ? "expandedLights" : "normalLights";
    this.body.onComplete = undefined;
    this.body.textures = this.assets[key];
    this.body.animationSpeed = playerAnimationConfig[key].animationSpeed;
    this.body.loop = true;
    this.body.gotoAndPlay(0);
  }

  private playLaserTransform(): void {
    this.body.textures = [
      this.assets.normalLights[0],
      ...this.assets.laserTransform,
    ];
    this.body.animationSpeed =
      playerAnimationConfig.laserTransform.animationSpeed;
    this.body.loop = false;
    this.body.onComplete = () => {
      if (this.renderedMode !== "laser") return;
      this.body.onComplete = undefined;
      this.body.textures = this.assets.laserLights;
      this.body.animationSpeed =
        playerAnimationConfig.laserLights.animationSpeed;
      this.body.loop = true;
      this.body.gotoAndPlay(0);
    };
    this.body.gotoAndPlay(0);
  }
}
