import { Application } from "pixi.js";

export class Game {
  readonly app = new Application();

  constructor(private readonly host: HTMLElement) {}

  async init(): Promise<void> {
    await this.app.init({ resizeTo: this.host });

    this.host.appendChild(this.app.canvas);

    this.app.ticker.add(this.update, this);
  }

  private update(): void {}

  start(): void {
    this.app.start();
  }

  destroy(): void {
    this.app.stop();
    this.app.ticker.remove(this.update, this);

    this.app.destroy({ removeView: true }, { children: true });
  }
}
