interface IWorldConfig {
  width: number;
  height: number;
  borderWidth: number;
}

export const worldConfig: IWorldConfig = {
  width: 224,
  height: 256,
  borderWidth: 8,
} as const;

export const fieldBounds = {
  left: worldConfig.borderWidth,
  right: worldConfig.width - worldConfig.borderWidth,
  top: worldConfig.borderWidth,
  bottom: worldConfig.height,
} as const;
