import {
  Controls,
  type ControlBindings,
  GameAssets,
  GameWorld,
  InputManager,
  type PlayerInputMode,
  Scene,
  type WorldEvent,
} from "@/core";
import { WorldView } from "@/rendering";
import { GameHud } from "@/ui/hud";
import { worldConfig } from "@/config";
import { DefeatOverlay, VictoryOverlay } from "@/ui/overlays";
import { Rectangle } from "pixi.js";

type GameAction = "moveLeft" | "moveRight" | "action" | "returnToMenu";
type ControlMode = "playing" | "result";

export class GameScene extends Scene {
  private readonly world = new GameWorld();
  private readonly controls: Controls<GameAction>;
  private controlMode: ControlMode = "playing";
  private direction = 0;
  private actionRequested = false;
  private mouseX: number | null = null;
  private pendingMouseAction = false;
  private readonly playingBindings: ControlBindings<GameAction> = {
    moveLeft: {
      key: "ArrowLeft",
      when: "held",
      handle: () => {
        this.direction--;
      },
    },
    moveRight: {
      key: "ArrowRight",
      when: "held",
      handle: () => {
        this.direction++;
      },
    },
    action: {
      key: "Space",
      when: "pressed",
      handle: () => {
        this.actionRequested = true;
      },
    },
  };
  private readonly resultBindings: ControlBindings<GameAction> = {
    returnToMenu: {
      key: "Space",
      when: "pressed",
      handle: () => this.onReturnToMenu(),
    },
  };
  private readonly worldView: WorldView;
  private readonly hud = new GameHud();
  private readonly defeatOverlay = new DefeatOverlay();
  private readonly victoryOverlay = new VictoryOverlay();
  private readonly handleWorldEvent = (event: WorldEvent): void => {
    if (event.type === "brickHit") {
      this.worldView.playBrickHit(event.brick);
    } else if (event.type === "enemyDestroyed") {
      this.worldView.playEnemyExplosion(event.enemy.position);
    } else if (event.type === "lifeLost" || event.type === "lifeGained") {
      this.hud.setLives(event.remainingLives);
    } else if (event.type === "scoreChanged") {
      this.hud.setScore(event.score);
    } else if (event.type === "levelStarted") {
      this.worldView.clearEnemyExplosions();
      this.hud.setRound(event.levelIndex);
    } else if (event.type === "gameEnded") {
      this.defeatOverlay.visible = event.outcome === "defeat";
      this.victoryOverlay.visible = event.outcome === "victory";
      this.controlMode = "result";
      this.controls.setBindings(this.resultBindings);
    }
  };

  constructor(
    inputManager: InputManager,
    assets: GameAssets,
    private readonly inputMode: PlayerInputMode,
    private readonly onReturnToMenu: () => void,
  ) {
    super();

    this.controls = new Controls(
      inputManager,
      inputMode === "keyboard" ? this.playingBindings : {},
    );

    if (inputMode === "mouse") {
      this.eventMode = "static";
      this.on("globalmousemove", (event) => {
        this.mouseX = this.worldView.toLocal(event.global).x;
      });
      this.on("pointerdown", (event) => {
        if (event.button !== 0 || event.pointerType !== "mouse") return;
        if (this.controlMode === "result") {
          this.onReturnToMenu();
        } else {
          this.pendingMouseAction = true;
        }
      });
    }

    this.worldView = new WorldView(
      {
        player: this.world.player,
        balls: this.world.balls,
        bricks: this.world.bricks,
        powerUps: this.world.powerUps,
        laserShots: this.world.laserShots,
        enemies: this.world.enemies,
        exitOpen: this.world.exitOpen,
      },
      assets,
    );
    const returnHint = inputMode === "mouse" ? "CLICK - MENU" : "SPACE - MENU";
    this.defeatOverlay.setReturnHint(returnHint);
    this.victoryOverlay.setReturnHint(returnHint);
    this.hud.setLives(this.world.lives);
    this.hud.setScore(this.world.score);
    this.hud.setRound(this.world.currentLevelIndex);

    this.addChild(
      this.worldView,
      this.hud,
      this.defeatOverlay,
      this.victoryOverlay,
    );
    this.world.onEvent(this.handleWorldEvent);
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    if (this.inputMode === "mouse") {
      this.hitArea = new Rectangle(0, 0, width, height);
    }

    const scale = height / worldConfig.height;

    const gameField = {
      width: worldConfig.width * scale,
      height: worldConfig.height * scale,
    };

    this.worldView.scale.set(scale);
    this.worldView.position.set(0, 0);
    this.hud.position.set(gameField.width, 0);
    this.hud.resize(height);

    this.defeatOverlay.resize(width, height);
    this.victoryOverlay.resize(width, height);
  }

  update(dtSeconds: number): void {
    this.direction = 0;
    this.actionRequested = this.pendingMouseAction;
    this.pendingMouseAction = false;
    this.controls.update();
    if (this.controlMode === "result") return;

    this.world.update({
      direction: this.direction,
      targetX: this.inputMode === "mouse" ? this.mouseX : null,
      actionPressed: this.actionRequested,
      dtSeconds,
    });
    this.worldView.sync({
      player: this.world.player,
      balls: this.world.balls,
      bricks: this.world.bricks,
      powerUps: this.world.powerUps,
      laserShots: this.world.laserShots,
      enemies: this.world.enemies,
      exitOpen: this.world.exitOpen,
    });
  }
}
