import { Controls, InputManager, Scene, type PlayerInputMode } from "@/core";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { MenuButton } from "@/ui/menu/MenuButton";
import { textStyles, tokens } from "@/theme/tokens";
import { Container } from "pixi.js";

type ControlsAction = "previous" | "next" | "confirm";

export class ControlsScene extends Scene {
  private readonly controls: Controls<ControlsAction>;
  private readonly menuContainer = new Container();
  private readonly title = createMenuLabel(
    "CONTROLS",
    textStyles.controlsTitle,
  );
  private readonly selectedModeLabel = createMenuLabel(
    "",
    textStyles.selectedMode,
  );
  private readonly options: MenuButton[];
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

    this.options = [
      new MenuButton(
        "KEYBOARD",
        () => this.selectMode("keyboard"),
        () => this.select(0),
      ),
      new MenuButton(
        "MOUSE",
        () => this.selectMode("mouse"),
        () => this.select(1),
      ),
      new MenuButton("BACK", this.onBack, () => this.select(2)),
    ];
    const rowStep = tokens.button.height + tokens.button.rowGap;
    const sectionGap = tokens.controls.sectionGap;
    this.title.y = -rowStep * 2 - sectionGap;
    this.options[0].y = -rowStep;
    this.options[1].y = 0;
    this.options[2].y = rowStep + sectionGap;
    this.selectedModeLabel.y = rowStep * 2 + sectionGap;

    this.menuContainer.addChild(
      this.title,
      ...this.options,
      this.selectedModeLabel,
    );
    this.addChild(this.menuContainer);
    this.updateSelectedModeLabel();
    this.updateSelection();
  }

  resize(width: number, height: number): void {
    this.menuContainer.position.set(width / 2, height / 2);
  }

  private select(index: number): void {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private moveSelection(direction: number): void {
    this.selectedIndex =
      (this.selectedIndex + direction + this.options.length) %
      this.options.length;
    this.updateSelection();
  }

  private updateSelection(): void {
    this.options.forEach((option, index) =>
      option.setSelected(index === this.selectedIndex),
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
    this.options[this.selectedIndex].activate();
  }

  update(): void {
    this.controls.update();
  }
}
