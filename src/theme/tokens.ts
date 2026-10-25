const fontFamily = "PixelOperator8";
const textColor = "#ffffff";

export const tokens = {
  color: {
    text: textColor,
    heading: "#ff6666",
    hudAccent: "#e74436",
    shade: 0x000000,
  },
  overlay: {
    shadeAlpha: 0.75,
  },
  button: {
    width: 280,
    height: 44,
    rowGap: 12,
    markerGap: 8,
  },
} as const;

export const textStyles = {
  menu: { fontFamily, fontSize: 32, fill: textColor },
  controlsTitle: { fontFamily, fontSize: 28, fill: textColor },
  levelTile: { fontFamily, fontSize: 26, fill: textColor },
  selectedMode: { fontFamily, fontSize: 20, fill: textColor },
  launchHint: {
    fontFamily,
    fontSize: 28,
    fill: textColor,
    stroke: { color: "#000000", width: 3 },
  },
  overlayTitle: { fontFamily, fontSize: 40, fill: tokens.color.heading },
  overlayHint: { fontFamily, fontSize: 20, fill: textColor },
  hudLabel: { fontFamily, fontSize: 24, fill: tokens.color.hudAccent },
  hudValue: { fontFamily, fontSize: 24, fill: textColor },
} as const;
