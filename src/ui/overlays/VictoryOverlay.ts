import { Container, Graphics, Text } from "pixi.js";
import { textStyles, tokens } from "@/theme/tokens";

export class VictoryOverlay extends Container {
  private readonly shade = new Graphics();

  private readonly title = new Text({
    text: "Victory",
    style: textStyles.overlayTitle,
  });

  private readonly hint = new Text({
    text: "SPACE - MENU",
    style: textStyles.overlayHint,
  });

  constructor() {
    super();

    this.visible = false;
    this.title.anchor.set(0.5);
    this.hint.anchor.set(0.5);
    this.addChild(this.shade, this.title, this.hint);
  }

  setReturnHint(text: string): void {
    this.hint.text = text;
  }

  resize(width: number, height: number): void {
    this.shade
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: tokens.color.shade, alpha: tokens.overlay.shadeAlpha });

    this.title.position.set(width / 2, height / 2 - 20);
    this.hint.position.set(width / 2, height / 2 + 28);
  }
}
