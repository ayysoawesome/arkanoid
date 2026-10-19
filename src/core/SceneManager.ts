import { Container } from "pixi.js";

export abstract class Scene extends Container {
  abstract resize(width: number, height: number): void;
}

type SceneFactory = () => Scene;
export type SceneId = "menu" | "game" | "gameover";

export class SceneManager {
  private readonly factories = new Map<SceneId, SceneFactory>();
  private currentScene: Scene | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(private readonly stage: Container) {}

  register(id: SceneId, factory: SceneFactory): void {
    this.factories.set(id, factory);
  }

  show(sceneId: SceneId): void {
    const factory = this.factories.get(sceneId);
    if (!factory) {
      throw new Error(`Scene "${sceneId}" is not registered`);
    }
    const nextScene = factory();

    if (this.currentScene) {
      this.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    this.currentScene = nextScene;

    this.stage.addChild(nextScene);
    nextScene.resize(this.width, this.height);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.currentScene?.resize(this.width, this.height);
  }

  destroy(): void {
    if (this.currentScene) {
      this.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
      this.currentScene = null;
    }

    this.factories.clear();
  }
}
