import { Container, Graphics, Text } from "pixi.js";
import { textStyles, tokens } from "@/theme/tokens";

export class LevelTransitionOverlay extends Container {
  private readonly shade = new Graphics();
  private readonly title = new Text({
    text: "",
    style: textStyles.overlayTitle,
  });

  constructor() {
    super();
    this.visible = false;
    this.shade.eventMode = "static";
    this.shade.on("pointerdown", (event) => event.stopPropagation());
    this.title.anchor.set(0.5);
    this.addChild(this.shade, this.title);
  }

  show(levelIndex: number): void {
    this.title.text = `ROUND ${levelIndex}`;
    this.visible = true;
  }

  resize(width: number, height: number): void {
    this.shade
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: tokens.color.shade, alpha: tokens.overlay.shadeAlpha });
    this.title.position.set(width / 2, height / 2);
  }
}
