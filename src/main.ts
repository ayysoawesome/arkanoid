import { Game } from "./core";
import { getElement } from "./utils";

const main = async () => {
  const host = getElement<HTMLElement>("#pixi-container");

  const game = new Game(host);

  await game.init();

  game.start();
};

main().catch((error: unknown) => {
  console.error("Failed to start game", error);
});
