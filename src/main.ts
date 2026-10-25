import { Game } from "./core";
import { getElement } from "./utils";

function keepCanvasFocused(canvas: HTMLCanvasElement): void {
  const focusCanvas = () => {
    if (document.visibilityState === "visible") {
      canvas.focus({ preventScroll: true });
    }
  };

  window.addEventListener("focus", focusCanvas);
  document.addEventListener("visibilitychange", focusCanvas);
  canvas.addEventListener("pointerdown", focusCanvas);
  focusCanvas();
}

const main = async () => {
  const host = getElement<HTMLElement>("#pixi-container");

  const game = new Game(host);

  await game.init();

  keepCanvasFocused(game.app.canvas);
  game.start();
};

main().catch((error: unknown) => {
  console.error("Failed to start game", error);
});
