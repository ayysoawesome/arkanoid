import { Controls, InputManager, Scene, type PlayerInputMode } from "@/core";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { Container, Text } from "pixi.js";

type ControlsAction = "previous" | "next" | "confirm";

export class ControlsScene extends Scene {
  private readonly controls: Controls<ControlsAction>;
  private readonly menuContainer = new Container();
  private readonly title = createMenuLabel("CONTROLS", 28);
  private readonly keyboardLabel = createMenuLabel("KEYBOARD");
  private readonly mouseLabel = createMenuLabel("MOUSE");
  private readonly backLabel = createMenuLabel("BACK");
  private readonly selectedModeLabel = createMenuLabel("", 20);
  private readonly selectionMarker = createMenuLabel(">");
  private readonly options = [
    this.keyboardLabel,
    this.mouseLabel,
    this.backLabel,
  ];
  private selectedIndex: number;

  constructor(
    inputManager: InputManager,
    private selectedMode: PlayerInputMode,
    private readonly onModeChange: (mode: PlayerInputMode) => void,
    private readonly onBack: () => void,
  ) {
    super();
    this.selectedIndex = selectedMode === "keyboard" ? 0 : 1;

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

    const rowStep = this.keyboardLabel.height + 12;
    this.title.y = -rowStep * 2;
    this.keyboardLabel.y = -rowStep;
    this.mouseLabel.y = 0;
    this.backLabel.y = rowStep;
    this.selectedModeLabel.y = rowStep * 2;

    this.configureOption(this.keyboardLabel, 0, () =>
      this.selectMode("keyboard"),
    );
    this.configureOption(this.mouseLabel, 1, () => this.selectMode("mouse"));
    this.configureOption(this.backLabel, 2, this.onBack);
    this.menuContainer.addChild(
      this.title,
      this.keyboardLabel,
      this.mouseLabel,
      this.backLabel,
      this.selectedModeLabel,
      this.selectionMarker,
    );
    this.addChild(this.menuContainer);
    this.updateSelectedModeLabel();
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

  private updateSelectedModeLabel(): void {
    this.selectedModeLabel.text = `SELECTED: ${this.selectedMode.toUpperCase()}`;
  }

  private selectMode(mode: PlayerInputMode): void {
    this.selectedMode = mode;
    this.onModeChange(mode);
    this.updateSelectedModeLabel();
  }

  private confirmSelection(): void {
    if (this.selectedIndex === 0) this.selectMode("keyboard");
    else if (this.selectedIndex === 1) this.selectMode("mouse");
    else this.onBack();
  }

  update(): void {
    this.controls.update();
  }
}
