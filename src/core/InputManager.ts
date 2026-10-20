const allowedKeys = new Set(["ArrowLeft", "ArrowRight", "Space"]);

export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private spacePressPending: boolean = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", this.onKeyDown);
    canvas.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("blur", this.onBlur);
  }

  consumeSpacePress(): boolean {
    const action = this.spacePressPending;
    this.spacePressPending = false;
    return action;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!allowedKeys.has(event.code)) return;
    event.preventDefault();

    if (
      event.code === "Space" &&
      !event.repeat &&
      !this.pressedKeys.has("Space")
    ) {
      this.spacePressPending = true;
    }

    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!allowedKeys.has(event.code)) return;
    event.preventDefault();
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.spacePressPending = false;
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
    this.spacePressPending = false;
    this.pressedKeys.clear();
  }
}
