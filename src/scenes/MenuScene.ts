import { Controls, InputManager, Scene } from "@/core";
import { Container, Text } from "pixi.js";

type MenuAction = "previous" | "next" | "confirm";

export class MenuScene extends Scene {
  private readonly controls: Controls<MenuAction>;
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
    inputManager: InputManager,
    private readonly onGameStart: () => void,
  ) {
    super();

    this.controls = new Controls(inputManager, {
      previous: {
        key: "ArrowUp",
        when: "pressed",
        handle: () => this.moveSelection(-1),
      },
      next: {
        key: "ArrowDown",
        when: "pressed",
        handle: () => this.moveSelection(1),
      },
      confirm: {
        key: "Space",
        when: "pressed",
        handle: () => this.confirmSelection(),
      },
    });

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

  private moveSelection(direction: number): void {
    this.selectedIndex =
      (this.selectedIndex + direction + this.options.length) %
      this.options.length;
    this.selectionMarker.y = this.options[this.selectedIndex].y;
  }

  private confirmSelection(): void {
    if (this.selectedIndex === 0) this.onGameStart();
  }

  update(_dtSeconds: number): void {
    this.controls.update();
  }
}
