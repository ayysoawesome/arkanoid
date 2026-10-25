import {
  Controls,
  type ControlBindings,
  GameAssets,
  GameWorld,
  InputManager,
  type PlayerInputMode,
  Scene,
  type WorldEvent,
  type WorldState,
} from "@/core";
import { WorldView } from "@/rendering";
import { GameHud } from "@/ui/hud";
import { worldConfig } from "@/config";
import { textStyles } from "@/theme/tokens";
import {
  DefeatOverlay,
  LevelTransitionOverlay,
  PauseOverlay,
  VictoryOverlay,
} from "@/ui/overlays";
import { Rectangle, Text } from "pixi.js";

const LEVEL_TRANSITION_SECONDS = 1.5;

type GameAction =
  | "moveLeft"
  | "moveRight"
  | "action"
  | "enableLaser"
  | "enableExpand"
  | "pause"
  | "resume"
  | "previousPauseOption"
  | "nextPauseOption"
  | "confirmPauseOption"
  | "returnToMenu";
type ControlMode = "playing" | "paused" | "transition" | "result";

export class GameScene extends Scene {
  private readonly world = new GameWorld();
  private readonly controls: Controls<GameAction>;
  private controlMode: ControlMode = "playing";
  private direction = 0;
  private actionRequested = false;
  private mouseX: number | null = null;
  private pendingMouseAction = false;
  private transitionSecondsRemaining = 0;
  private readonly pauseBinding: ControlBindings<GameAction> = {
    pause: {
      key: "Escape",
      when: "pressed",
      handle: () => this.pause(),
    },
  };
  private readonly playingBindings: ControlBindings<GameAction> = {
    ...this.pauseBinding,
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
  private readonly testBindings: ControlBindings<GameAction> = import.meta.env
    .DEV
    ? {
        enableLaser: {
          key: "KeyL",
          when: "pressed",
          handle: () => this.world.applyDebugPowerUp("laser"),
        },
        enableExpand: {
          key: "KeyE",
          when: "pressed",
          handle: () => this.world.applyDebugPowerUp("expand"),
        },
      }
    : {};
  private readonly resultBindings: ControlBindings<GameAction> = {
    returnToMenu: {
      key: "Space",
      when: "pressed",
      handle: () => this.onReturnToMenu(),
    },
  };
  private readonly pauseBindings: ControlBindings<GameAction> = {
    resume: {
      key: "Escape",
      when: "pressed",
      handle: () => this.resume(),
    },
    previousPauseOption: {
      key: "ArrowUp",
      when: "pressed",
      handle: () => this.pauseOverlay.moveSelection(-1),
    },
    nextPauseOption: {
      key: "ArrowDown",
      when: "pressed",
      handle: () => this.pauseOverlay.moveSelection(1),
    },
    confirmPauseOption: {
      key: "Space",
      when: "pressed",
      handle: () => this.pauseOverlay.confirmSelection(),
    },
  };
  private readonly worldView: WorldView;
  private readonly launchHint: Text;
  private readonly hud: GameHud;
  private readonly defeatOverlay = new DefeatOverlay();
  private readonly victoryOverlay = new VictoryOverlay();
  private readonly pauseOverlay = new PauseOverlay(
    () => this.resume(),
    () => this.onReturnToMenu(),
  );
  private readonly levelTransitionOverlay = new LevelTransitionOverlay();
  private readonly handleWorldEvent = (event: WorldEvent): void => {
    if (event.type === "brickHit") {
      this.worldView.playBrickHit(event.brickId);
    } else if (event.type === "enemyDestroyed") {
      this.worldView.playEnemyExplosion(event.enemy);
    } else if (event.type === "lifeLost" || event.type === "lifeGained") {
      this.hud.setLives(event.remainingLives);
    } else if (event.type === "scoreChanged") {
      this.hud.setScore(event.score);
      this.onHighScoreChange(event.score);
    } else if (event.type === "levelStarted") {
      this.worldView.clearEnemyExplosions();
      this.hud.setRound(event.levelIndex);
      this.showLevelTransition(event.levelIndex);
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
    highScore: number,
    private readonly onHighScoreChange: (score: number) => void,
    singleLevelIndex: number | null = null,
  ) {
    super();

    this.controls = new Controls(
      inputManager,
      inputMode === "keyboard"
        ? { ...this.playingBindings, ...this.testBindings }
        : { ...this.pauseBinding, ...this.testBindings },
    );

    if (inputMode === "mouse") {
      this.eventMode = "static";
      this.on("globalmousemove", (event) => {
        if (this.controlMode === "playing") {
          this.mouseX = this.worldView.toLocal(event.global).x;
        }
      });
      this.on("pointerdown", (event) => {
        if (event.button !== 0 || event.pointerType !== "mouse") return;
        if (this.controlMode === "paused" || this.controlMode === "transition")
          return;
        if (this.controlMode === "result") {
          this.onReturnToMenu();
        } else {
          this.pendingMouseAction = true;
        }
      });
    }

    this.hud = new GameHud(assets.normalLights[0], highScore);
    this.worldView = new WorldView(this.world.state, assets);
    this.launchHint = new Text({
      text: inputMode === "mouse" ? "CLICK TO LAUNCH" : "SPACE TO LAUNCH",
      style: textStyles.launchHint,
    });
    this.launchHint.anchor.set(0.5);
    const returnHint = inputMode === "mouse" ? "CLICK - MENU" : "SPACE - MENU";
    this.defeatOverlay.setReturnHint(returnHint);
    this.victoryOverlay.setReturnHint(returnHint);

    this.addChild(
      this.worldView,
      this.launchHint,
      this.hud,
      this.defeatOverlay,
      this.victoryOverlay,
      this.pauseOverlay,
      this.levelTransitionOverlay,
    );
    this.world.onEvent(this.handleWorldEvent);

    if (singleLevelIndex === null) {
      this.world.startCampaign();
    } else {
      this.world.startSingleLevel(singleLevelIndex);
    }

    this.hud.setLives(this.world.lives);
    this.hud.setScore(this.world.score);
    const state = this.world.state;
    this.worldView.sync(state);
    this.updateLaunchHint(state);
    this.worldView.setPaused(true);
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
    this.launchHint.style.fontSize = Math.min(28, Math.max(12, 9 * scale));
    this.updateLaunchHint();
    this.hud.position.set(gameField.width, 0);
    this.hud.resize(height);

    this.defeatOverlay.resize(width, height);
    this.victoryOverlay.resize(width, height);
    this.pauseOverlay.resize(width, height);
    this.levelTransitionOverlay.resize(width, height);
  }

  update(dtSeconds: number): void {
    if (this.controlMode === "transition") {
      this.transitionSecondsRemaining -= dtSeconds;
      if (this.transitionSecondsRemaining <= 0) {
        this.finishLevelTransition();
      }
      return;
    }

    this.direction = 0;
    this.actionRequested = this.pendingMouseAction;
    this.pendingMouseAction = false;
    this.controls.update();
    if (this.controlMode !== "playing") return;

    this.world.update({
      direction: this.direction,
      targetX: this.inputMode === "mouse" ? this.mouseX : null,
      actionPressed: this.actionRequested,
      dtSeconds,
    });
    const state = this.world.state;
    this.worldView.sync(state);
    this.updateLaunchHint(state);
    if (this.levelTransitionOverlay.visible) {
      this.worldView.setPaused(true);
    }
  }

  private updateLaunchHint(state: WorldState = this.world.state): void {
    this.launchHint.visible =
      state.playerPhaseFrame === null &&
      state.balls.some((ball) => ball.attached);
    const scale = this.worldView.scale.x;
    const halfWidth = this.launchHint.width / 2;
    const border = worldConfig.borderWidth * scale;
    this.launchHint.y = (state.player.position.y - 32) * scale;
    this.launchHint.x = Math.max(
      halfWidth + border,
      Math.min(
        worldConfig.width * scale - border - halfWidth,
        state.player.position.x * scale,
      ),
    );
  }

  private showLevelTransition(levelIndex: number): void {
    this.controlMode = "transition";
    this.transitionSecondsRemaining = LEVEL_TRANSITION_SECONDS;
    this.pendingMouseAction = false;
    this.mouseX = null;
    this.controls.setBindings({});
    this.levelTransitionOverlay.show(levelIndex);
  }

  private finishLevelTransition(): void {
    this.levelTransitionOverlay.visible = false;
    this.worldView.setPaused(false);
    this.controlMode = "playing";
    this.controls.setBindings(
      this.inputMode === "keyboard"
        ? { ...this.playingBindings, ...this.testBindings }
        : { ...this.pauseBinding, ...this.testBindings },
    );
  }

  private pause(): void {
    if (this.controlMode !== "playing") return;
    this.controlMode = "paused";
    this.pendingMouseAction = false;
    this.worldView.setPaused(true);
    this.pauseOverlay.show();
    this.controls.setBindings(this.pauseBindings);
  }

  private resume(): void {
    if (this.controlMode !== "paused") return;
    this.controlMode = "playing";
    this.worldView.setPaused(false);
    this.mouseX = null;
    this.pauseOverlay.visible = false;
    this.controls.setBindings(
      this.inputMode === "keyboard"
        ? { ...this.playingBindings, ...this.testBindings }
        : { ...this.pauseBinding, ...this.testBindings },
    );
  }
}
