import {
  enemyGateX,
  exitBounds,
  fieldBounds,
  worldConfig,
  type EnemyGateFrame,
  type EnemyGateSide,
} from "@/config";
import type { GameAssets } from "@/core";
import {
  AnimatedSprite,
  Container,
  Graphics,
  Sprite,
  TilingSprite,
} from "pixi.js";

export class FieldView extends Container {
  private readonly gatesView = new Container();
  private readonly gateViews: Record<EnemyGateSide, Sprite>;
  private readonly gateFrames: GameAssets["field"]["gateFrames"];
  private readonly closedExit: Sprite;
  private readonly exitView: AnimatedSprite;

  constructor(assets: GameAssets["field"]) {
    super();
    this.gateFrames = assets.gateFrames;

    const base = new Graphics()
      .rect(0, 0, worldConfig.width, worldConfig.height)
      .fill(0x000000);

    const background = new TilingSprite({
      texture: assets.background,
      width: fieldBounds.right - fieldBounds.left,
      height: fieldBounds.bottom - fieldBounds.top,
    });
    background.position.set(fieldBounds.left, fieldBounds.top);

    const topRail = new TilingSprite({
      texture: assets.topRail,
      width:
        worldConfig.width - assets.cornerLeft.width - assets.cornerRight.width,
      height: worldConfig.borderWidth,
    });
    topRail.position.set(assets.cornerLeft.width, 0);

    const leftCorner = new Sprite(assets.cornerLeft);
    const rightCorner = new Sprite(assets.cornerRight);
    rightCorner.x = worldConfig.width - rightCorner.width;

    const leftSide = new Sprite(assets.sideLeft);
    leftSide.y = leftCorner.height;

    const rightSide = new Sprite(assets.sideRight);
    rightSide.position.set(fieldBounds.right, rightCorner.height);

    this.closedExit = new Sprite(assets.closedExit);
    this.closedExit.position.set(exitBounds.left, exitBounds.top);
    this.exitView = new AnimatedSprite({
      textures: assets.exitFrames,
      animationSpeed: 0.12,
    });
    this.exitView.position.set(exitBounds.left, exitBounds.top);
    this.exitView.visible = false;

    const leftGate = new Sprite(assets.gateFrames[0]);
    const rightGate = new Sprite(assets.gateFrames[0]);
    leftGate.x = enemyGateX.left;
    rightGate.x = enemyGateX.right;
    this.gateViews = { left: leftGate, right: rightGate };
    this.gatesView.addChild(leftGate, rightGate);

    this.addChild(
      base,
      background,
      topRail,
      leftCorner,
      rightCorner,
      leftSide,
      rightSide,
      this.closedExit,
      this.exitView,
      this.gatesView,
    );
  }

  setGateFrames(frames: Readonly<Record<EnemyGateSide, EnemyGateFrame>>): void {
    for (const side of ["left", "right"] as const) {
      this.gateViews[side].texture = this.gateFrames[frames[side]];
    }
  }

  setExitOpen(open: boolean): void {
    if (this.exitView.visible === open) return;

    this.closedExit.visible = !open;
    this.exitView.visible = open;
    if (open) {
      this.exitView.gotoAndPlay(0);
    } else {
      this.exitView.gotoAndStop(0);
    }
  }
}
