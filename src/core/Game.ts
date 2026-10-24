import { Application, Assets, Ticker } from "pixi.js";
import { SceneManager } from "./SceneManager";
import { GameScene } from "@/scenes/GameScene";
import { InputManager } from "./InputManager";
import { gameConfig } from "@/config";
import { GameAssets, loadGameAssets } from "./assetsLoader";
import { ControlsScene, MenuScene } from "@/scenes";
import type { PlayerInputMode } from "./PlayerInputMode";

const HIGH_SCORE_STORAGE_KEY = "arkanoid.highScore";

function loadHighScore(): number {
  try {
    const storedValue = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (storedValue === null) return gameConfig.initialHighScore;

    const score = Number(storedValue);
    return Number.isSafeInteger(score) && score >= 0
      ? score
      : gameConfig.initialHighScore;
  } catch {
    return gameConfig.initialHighScore;
  }
}

function saveHighScore(score: number): void {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Keep the updated score for this session if storage is unavailable.
  }
}

export class Game {
  readonly app = new Application();
  private sceneManager!: SceneManager;
  private inputManager!: InputManager;
  private accumulator: number = 0;
  private playerInputMode: PlayerInputMode = "mouse";
  private highScore: number = loadHighScore();
  private menuSelection: 0 | 1 = 0;

  private onRendererResize = (width: number, height: number): void => {
    this.sceneManager?.resize(width, height);
  };

  constructor(private readonly host: HTMLElement) {}

  async init(): Promise<void> {
    await this.app.init({ resizeTo: this.host });
    this.host.appendChild(this.app.canvas);

    this.inputManager = new InputManager(this.app.canvas);
    this.sceneManager = new SceneManager(this.app.stage);

    await Assets.load({
      src: "/fonts/PixelOperator8.ttf",
      data: { family: "PixelOperator8" },
    });
    const assets = await loadGameAssets();
    this.registerScenes(assets);
    this.sceneManager.resize(this.app.screen.width, this.app.screen.height);
    this.sceneManager.show("menu");

    this.app.renderer.on("resize", this.onRendererResize);

    this.app.ticker.add(this.update, this);
  }

  private update(ticker: Ticker): void {
    this.accumulator += ticker.deltaMS / 1000;
    let updates = 0;
    while (
      this.accumulator >= gameConfig.updateStepSeconds &&
      updates < gameConfig.maxUpdatesPerFrame
    ) {
      this.sceneManager.update(gameConfig.updateStepSeconds);
      this.accumulator -= gameConfig.updateStepSeconds;
      updates++;
    }

    if (this.accumulator >= gameConfig.updateStepSeconds) {
      this.accumulator = 0;
    }
  }

  private registerScenes(assets: GameAssets): void {
    const handleReturnToMenu = () => {
      this.menuSelection = 0;
      this.sceneManager.show("menu");
    };
    this.sceneManager.register("game", () => {
      return new GameScene(
        this.inputManager,
        assets,
        this.playerInputMode,
        handleReturnToMenu,
        this.highScore,
        (score) => {
          if (score <= this.highScore) return;
          this.highScore = score;
          saveHighScore(score);
        },
      );
    });
    const handleGameStart = () => {
      this.menuSelection = 0;
      this.sceneManager.show("game");
    };
    const handleOpenControls = () => {
      this.menuSelection = 1;
      this.sceneManager.show("controls");
    };
    this.sceneManager.register(
      "menu",
      () =>
        new MenuScene(
          this.inputManager,
          handleGameStart,
          handleOpenControls,
          this.menuSelection,
        ),
    );
    this.sceneManager.register(
      "controls",
      () =>
        new ControlsScene(
          this.inputManager,
          this.playerInputMode,
          (mode) => {
            this.playerInputMode = mode;
          },
          () => this.sceneManager.show("menu"),
        ),
    );
  }

  start(): void {
    this.app.canvas.focus();
    this.app.start();
  }

  destroy(): void {
    this.app.stop();
    this.app.ticker.remove(this.update, this);
    this.inputManager?.destroy();
    this.sceneManager?.destroy();
    this.app.renderer.off("resize", this.onRendererResize);
    this.app.destroy({ removeView: true }, { children: true });
  }
}
