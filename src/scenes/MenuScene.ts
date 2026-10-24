import { Controls, InputManager, Scene } from "@/core";
import { MenuButton } from "@/ui/menu/MenuButton";
import { tokens } from "@/theme/tokens";
import { Container } from "pixi.js";

type MenuAction = "previous" | "next" | "confirm";
export type MenuOptionId = "play" | "selectLevel" | "controls";

interface MenuOption {
  id: MenuOptionId;
  button: MenuButton;
}

export class MenuScene extends Scene {
  private readonly controls: Controls<MenuAction>;
  private readonly menuContainer = new Container();
  private readonly options: MenuOption[];
  private selectedOption: MenuOptionId;

  constructor(
    inputManager: InputManager,
    private readonly onGameStart: () => void,
    private readonly onOpenLevelSelect: () => void,
    private readonly onOpenControls: () => void,
    initialSelection: MenuOptionId = "play",
  ) {
    super();
    this.selectedOption = initialSelection;

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

    const menuItems: {
      id: MenuOptionId;
      label: string;
      activate: () => void;
    }[] = [
      { id: "play", label: "PLAY", activate: this.onGameStart },
      {
        id: "selectLevel",
        label: "SELECT LEVEL",
        activate: this.onOpenLevelSelect,
      },
      { id: "controls", label: "CONTROLS", activate: this.onOpenControls },
    ];
    this.options = menuItems.map(({ id, label, activate }) => ({
      id,
      button: new MenuButton(label, activate, () => this.select(id)),
    }));
    const rowStep = tokens.button.height + tokens.button.rowGap;
    this.options.forEach(({ button }, index) => {
      button.y = (index - (this.options.length - 1) / 2) * rowStep;
    });
    this.menuContainer.addChild(...this.options.map(({ button }) => button));
    this.addChild(this.menuContainer);
    this.updateSelection();
  }

  resize(width: number, height: number): void {
    this.menuContainer.position.set(width / 2, height / 2);
  }

  private select(option: MenuOptionId): void {
    this.selectedOption = option;
    this.updateSelection();
  }

  private moveSelection(direction: number): void {
    const currentIndex = this.options.findIndex(
      ({ id }) => id === this.selectedOption,
    );
    const nextIndex =
      (currentIndex + direction + this.options.length) % this.options.length;
    this.select(this.options[nextIndex].id);
  }

  private updateSelection(): void {
    this.options.forEach(({ id, button }) =>
      button.setSelected(id === this.selectedOption),
    );
  }

  private confirmSelection(): void {
    this.options
      .find(({ id }) => id === this.selectedOption)
      ?.button.activate();
  }

  update(): void {
    this.controls.update();
  }
}
