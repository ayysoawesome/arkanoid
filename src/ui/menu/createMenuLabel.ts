import { Text } from "pixi.js";
import { textStyles } from "@/theme/tokens";

export const createMenuLabel = (
  text: string,
  style: (typeof textStyles)[keyof typeof textStyles] = textStyles.menu,
): Text => {
  const label = new Text({
    text,
    style,
  });
  label.anchor.set(0.5);
  return label;
};
