import { Application } from "pixi.js";
import { SceneManager } from "./SceneManager";
import { GameScene } from "@/scenes/GameScene";

export class Game {
  readonly app = new Application();
  private sceneManager: SceneManager | null = null;

  private onRendererResize = (width: number, height: number): void => {
    this.sceneManager?.resize(width, height);
  };

  constructor(private readonly host: HTMLElement) {}

  async init(): Promise<void> {
    await this.app.init({ resizeTo: this.host });

    this.host.appendChild(this.app.canvas);

    this.sceneManager = new SceneManager(this.app.stage);
    this.registerScenes();
    this.sceneManager.resize(this.app.screen.width, this.app.screen.height);
    this.sceneManager.show("game");

    this.app.renderer.on("resize", this.onRendererResize);

    this.app.ticker.add(this.update, this);
  }

  private update(): void {}

  private registerScenes(): void {
    this.sceneManager?.register("game", () => {
      return new GameScene();
    });
  }

  start(): void {
    this.app.start();
  }

  destroy(): void {
    this.app.stop();
    this.app.ticker.remove(this.update, this);
    this.sceneManager?.destroy();
    this.sceneManager = null;
    this.app.renderer.off("resize", this.onRendererResize);

    this.app.destroy({ removeView: true }, { children: true });
  }
}
