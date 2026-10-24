import { Container, Graphics } from "pixi.js";
import { textStyles, tokens } from "@/theme/tokens";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { MenuButton } from "@/ui/menu/MenuButton";

export class PauseOverlay extends Container {
  private readonly shade = new Graphics();
  private readonly title = createMenuLabel("PAUSED", textStyles.overlayTitle);
  private readonly options: MenuButton[];
  private selectedIndex = 0;

  constructor(onResume: () => void, onExit: () => void) {
    super();
    this.visible = false;
    this.shade.eventMode = "static";
    this.shade.on("pointerdown", (event) => event.stopPropagation());
    this.options = [
      new MenuButton("RESUME", onResume, () => this.select(0)),
      new MenuButton("EXIT", onExit, () => this.select(1)),
    ];
    this.addChild(this.shade, this.title, ...this.options);
    this.updateSelection();
  }

  show(): void {
    this.selectedIndex = 0;
    this.updateSelection();
    this.visible = true;
  }

  moveSelection(direction: number): void {
    this.select(
      (this.selectedIndex + direction + this.options.length) %
        this.options.length,
    );
  }

  confirmSelection(): void {
    this.options[this.selectedIndex].activate();
  }

  resize(width: number, height: number): void {
    this.shade
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: tokens.color.shade, alpha: tokens.overlay.shadeAlpha });
    const centerX = width / 2;
    const centerY = height / 2;
    const rowStep = tokens.button.height + tokens.button.rowGap;
    this.title.position.set(centerX, centerY - rowStep);
    this.options[0].position.set(centerX, centerY + 12);
    this.options[1].position.set(centerX, centerY + 12 + rowStep);
  }

  private select(index: number): void {
    this.selectedIndex = index;
    this.updateSelection();
  }

  private updateSelection(): void {
    this.options.forEach((option, index) =>
      option.setSelected(index === this.selectedIndex),
    );
  }
}
