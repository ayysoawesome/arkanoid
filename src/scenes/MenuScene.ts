import { Controls, InputManager, Scene } from "@/core";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { Container, Text } from "pixi.js";

type MenuAction = "previous" | "next" | "confirm";

export class MenuScene extends Scene {
  private readonly controls: Controls<MenuAction>;
  private readonly menuContainer = new Container();
  private readonly playLabel = createMenuLabel("PLAY");
  private readonly controlsLabel = createMenuLabel("CONTROLS");
  private readonly selectionMarker = createMenuLabel(">");
  private readonly options = [this.playLabel, this.controlsLabel];
  private selectedIndex: number;

  constructor(
    inputManager: InputManager,
    private readonly onGameStart: () => void,
    private readonly onOpenControls: () => void,
    initialSelection = 0,
  ) {
    super();
    this.selectedIndex = initialSelection;

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

    const rowStep = this.playLabel.height + 12;
    this.playLabel.y = -rowStep / 2;
    this.controlsLabel.y = rowStep / 2;
    this.configureOption(this.playLabel, 0, this.onGameStart);
    this.configureOption(this.controlsLabel, 1, this.onOpenControls);
    this.menuContainer.addChild(
      this.playLabel,
      this.controlsLabel,
      this.selectionMarker,
    );
    this.addChild(this.menuContainer);
    this.updateSelectionMarker();
  }

  resize(width: number, height: number): void {
    this.menuContainer.position.set(width / 2, height / 2);
  }

  private configureOption(
    label: Text,
    index: number,
    activate: () => void,
  ): void {
    label.eventMode = "static";
    label.cursor = "pointer";
    label.on("pointerover", () => {
      this.selectedIndex = index;
      this.updateSelectionMarker();
    });
    label.on("pointertap", activate);
  }

  private moveSelection(direction: number): void {
    this.selectedIndex =
      (this.selectedIndex + direction + this.options.length) %
      this.options.length;
    this.updateSelectionMarker();
  }

  private updateSelectionMarker(): void {
    const widestLabel = Math.max(...this.options.map((label) => label.width));
    this.selectionMarker.position.set(
      -widestLabel / 2 - this.selectionMarker.width / 2 - 8,
      this.options[this.selectedIndex].y,
    );
  }

  private confirmSelection(): void {
    if (this.selectedIndex === 0) this.onGameStart();
    else this.onOpenControls();
  }

  update(): void {
    this.controls.update();
  }
}
