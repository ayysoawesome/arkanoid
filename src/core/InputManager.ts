const inputKeys = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
] as const;

export type InputKey = (typeof inputKeys)[number];

const allowedKeys = new Set<string>(inputKeys);

export class InputManager {
  private readonly pressedKeys = new Set<string>();
  private readonly pendingPresses = new Set<string>();

  constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.tabIndex = 0;
    canvas.addEventListener("keydown", this.onKeyDown);
    canvas.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("blur", this.onBlur);
  }

  consumeKeyPress(code: InputKey): boolean {
    const pressed = this.pendingPresses.has(code);
    this.pendingPresses.delete(code);
    return pressed;
  }

  isDown(code: InputKey): boolean {
    return this.pressedKeys.has(code);
  }

  clearPendingPresses(): void {
    this.pendingPresses.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!allowedKeys.has(event.code)) return;
    event.preventDefault();

    if (!event.repeat && !this.pressedKeys.has(event.code)) {
      this.pendingPresses.add(event.code);
    }

    this.pressedKeys.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (!allowedKeys.has(event.code)) return;
    event.preventDefault();
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pendingPresses.clear();
    this.pressedKeys.clear();
  };

  destroy(): void {
    this.canvas.removeEventListener("keydown", this.onKeyDown);
    this.canvas.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("blur", this.onBlur);
    this.pendingPresses.clear();
    this.pressedKeys.clear();
  }
}
