const allowedKeys = new Set(["ArrowLeft", "ArrowRight"]);

export class InputManager {
  private readonly pressedKeys = new Set<string>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", this.onKeyDown);
    canvas.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("blur", this.onBlur);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!allowedKeys.has(event.code)) return;
    event.preventDefault();
    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
    event.preventDefault();
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedKeys.clear();
  };

  get horizontal(): number {
    return (
      Number(this.pressedKeys.has("ArrowRight")) -
      Number(this.pressedKeys.has("ArrowLeft"))
    );
  }

  destroy(): void {
    this.canvas.removeEventListener("keydown", this.onKeyDown);
    this.canvas.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("blur", this.onBlur);
    this.pressedKeys.clear();
  }
}
