import { Container, Rectangle } from "pixi.js";
import { tokens } from "@/theme/tokens";
import { createMenuLabel } from "./createMenuLabel";

export class MenuButton extends Container {
  private readonly textLabel: ReturnType<typeof createMenuLabel>;
  private readonly marker = createMenuLabel(">");

  constructor(
    text: string,
    private readonly onActivate: () => void,
    onSelect: () => void,
  ) {
    super();
    this.textLabel = createMenuLabel(text);
    this.marker.position.set(
      -this.textLabel.width / 2 -
        this.marker.width / 2 -
        tokens.button.markerGap,
      0,
    );
    this.marker.alpha = 0;
    this.addChild(this.textLabel, this.marker);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(
      -tokens.button.width / 2,
      -tokens.button.height / 2,
      tokens.button.width,
      tokens.button.height,
    );
    this.on("pointerover", onSelect);
    this.on("pointerdown", (event) => event.stopPropagation());
    this.on("pointertap", (event) => {
      event.stopPropagation();
      this.activate();
    });
  }

  activate(): void {
    this.onActivate();
  }

  setSelected(selected: boolean): void {
    this.marker.alpha = selected ? 1 : 0;
  }
}
