interface IWorldConfig {
  width: number;
  height: number;
  borderWidth: number;
  initialLives: number;
  exit: { width: number; height: number };
}

export const worldConfig: IWorldConfig = {
  width: 202,
  height: 230,
  borderWidth: 8,
  initialLives: 3,
  exit: { width: 8, height: 40 },
} as const;

export const fieldBounds = {
  left: worldConfig.borderWidth,
  right: worldConfig.width - worldConfig.borderWidth,
  top: worldConfig.borderWidth,
  bottom: worldConfig.height,
} as const;

export const exitBounds = {
  left: worldConfig.width - worldConfig.exit.width,
  right: worldConfig.width,
  top: worldConfig.height - worldConfig.exit.height,
  bottom: worldConfig.height,
} as const;
