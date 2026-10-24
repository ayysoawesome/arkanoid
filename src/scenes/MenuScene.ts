import { Controls, InputManager, Scene } from "@/core";
import { MenuButton } from "@/ui/menu/MenuButton";
import { tokens } from "@/theme/tokens";
import { Container } from "pixi.js";

type MenuAction = "previous" | "next" | "confirm";

export class MenuScene extends Scene {
  private readonly controls: Controls<MenuAction>;
  private readonly menuContainer = new Container();
  private readonly options: MenuButton[];
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

    this.options = [
      new MenuButton("PLAY", this.onGameStart, () => this.select(0)),
      new MenuButton("CONTROLS", this.onOpenControls, () => this.select(1)),
    ];
    const rowStep = tokens.button.height + tokens.button.rowGap;
    this.options[0].y = -rowStep / 2;
    this.options[1].y = rowStep / 2;
    this.menuContainer.addChild(...this.options);
    this.addChild(this.menuContainer);
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

  private confirmSelection(): void {
    this.options[this.selectedIndex].activate();
  }

  update(): void {
    this.controls.update();
  }
}
