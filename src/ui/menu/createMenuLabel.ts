import { Text } from "pixi.js";

export const createMenuLabel = (text: string, fontSize = 32): Text => {
  const label = new Text({
    text,
    style: {
      fontFamily: "PixelOperator8",
      fontSize,
      fill: "#ffffff",
    },
  });
  label.anchor.set(0.5);
  return label;
};
