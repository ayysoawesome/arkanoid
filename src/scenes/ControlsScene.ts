import { Controls, InputManager, Scene, type PlayerInputMode } from "@/core";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { MenuButton } from "@/ui/menu/MenuButton";
import { textStyles } from "@/theme/tokens";
import { Container } from "pixi.js";

type ControlsAction = "previous" | "next" | "confirm";

const MIN_LAYOUT_HEIGHT = 600;
const layout = {
  title: 0.2,
  keyboard: 0.33,
  mouse: 0.43,
  selectedMode: 0.53,
  firstInstruction: 0.6,
  instructionStep: 0.05,
  back: 0.84,
} as const;

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
  private readonly instructionLabels = [
    createMenuLabel("", textStyles.selectedMode),
    createMenuLabel("", textStyles.selectedMode),
    createMenuLabel("", textStyles.selectedMode),
    createMenuLabel("", textStyles.selectedMode),
  ];
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
    this.menuContainer.addChild(
      this.title,
      ...this.options,
      this.selectedModeLabel,
      ...this.instructionLabels,
    );
    this.addChild(this.menuContainer);
    this.updateSelectedModeLabel();
    this.updateSelection();
  }

  resize(width: number, height: number): void {
    const layoutHeight = Math.max(height, MIN_LAYOUT_HEIGHT);
    const scale = Math.min(1, (width - 24) / 450, height / layoutHeight);
    const yAt = (fraction: number) => (fraction - 0.5) * layoutHeight;

    this.title.y = yAt(layout.title);
    this.options[0].y = yAt(layout.keyboard);
    this.options[1].y = yAt(layout.mouse);
    this.selectedModeLabel.y = yAt(layout.selectedMode);
    this.instructionLabels.forEach((label, index) => {
      label.y = yAt(layout.firstInstruction + index * layout.instructionStep);
    });
    this.options[2].y = yAt(layout.back);

    this.menuContainer.scale.set(Math.max(0, scale));
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
    const instructions =
      this.selectedMode === "keyboard"
        ? [
            "LEFT / RIGHT - MOVE",
            "SPACE - LAUNCH / FIRE",
            "ESC - PAUSE",
            "M - SOUND ON / OFF",
          ]
        : [
            "MOVE MOUSE - MOVE",
            "LEFT CLICK - LAUNCH / FIRE",
            "ESC - PAUSE",
            "M - SOUND ON / OFF",
          ];
    this.instructionLabels.forEach((label, index) => {
      label.text = instructions[index];
    });
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
