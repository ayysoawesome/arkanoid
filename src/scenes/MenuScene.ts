import { InputManager, Scene } from "@/core";
import { Container, Text } from "pixi.js";

export class MenuScene extends Scene {
  private readonly menuContainer = new Container();
  private readonly playLabel = new Text({
    text: "PLAY",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 32,
      fill: "#ffffff",
    },
  });

  private readonly controlsLabel = new Text({
    text: "CONTROLS",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 32,
      fill: "#ffffff",
    },
  });

  private readonly selectionMarker = new Text({
    text: ">",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 32,
      fill: "#ffffff",
    },
  });

  private readonly options = [this.playLabel, this.controlsLabel];
  private selectedIndex = 0;

  constructor(
    readonly inputManager: InputManager,
    private readonly onGameStart: () => void,
  ) {
    super();

    this.playLabel.anchor.set(0.5);
    this.controlsLabel.anchor.set(0.5);
    this.selectionMarker.anchor.set(0.5);

    const rowStep = this.playLabel.height + 12;

    this.playLabel.position.set(0, -rowStep / 2);
    this.controlsLabel.position.set(0, rowStep / 2);

    const widestLabel = Math.max(
      this.playLabel.width,
      this.controlsLabel.width,
    );

    this.selectionMarker.position.set(
      -widestLabel / 2 - this.selectionMarker.width / 2 - 8,
      this.playLabel.y,
    );

    this.menuContainer.addChild(
      this.playLabel,
      this.controlsLabel,
      this.selectionMarker,
    );

    this.addChild(this.menuContainer);
  }

  resize(width: number, height: number): void {
    this.menuContainer.position.set(width / 2, height / 2);
  }

  update(_dtSeconds: number): void {
    const up = this.inputManager.consumeKeyPress("ArrowUp");
    const down = this.inputManager.consumeKeyPress("ArrowDown");
    const move = Number(down) - Number(up);

    if (move !== 0) {
      this.selectedIndex =
        (this.selectedIndex + move + this.options.length) % this.options.length;
      this.selectionMarker.y = this.options[this.selectedIndex].y;
    }

    if (
      this.inputManager.consumeKeyPress("Space") &&
      this.selectedIndex === 0
    ) {
      this.onGameStart();
    }
  }
}
