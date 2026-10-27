import type { GameAudio } from "@/core/GameAudio";

export class MuteButton {
  private readonly element: HTMLButtonElement;

  constructor(
    host: HTMLElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly audio: GameAudio,
  ) {
    this.element = document.createElement("button");
    this.element.type = "button";
    this.element.className = "mute-button";
    this.element.setAttribute("aria-keyshortcuts", "M");
    this.element.addEventListener("click", this.onClick);
    host.appendChild(this.element);
    window.addEventListener("keydown", this.onKeyDown);
    this.sync();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      event.code !== "KeyM" ||
      event.repeat ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    event.preventDefault();
    this.toggle();
  };

  private readonly onClick = (): void => {
    this.toggle();
  };

  private toggle(): void {
    this.audio.toggleMuted();
    this.sync();
    this.canvas.focus({ preventScroll: true });
  }

  private sync(): void {
    const muted = this.audio.muted;
    this.element.setAttribute("aria-pressed", String(muted));
    this.element.setAttribute(
      "aria-label",
      muted ? "Turn sound on (M)" : "Turn sound off (M)",
    );
  }

  destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.element.removeEventListener("click", this.onClick);
    this.element.remove();
  }
}
