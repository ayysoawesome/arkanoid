interface IWorldConfig {
  width: number;
  height: number;
}

export const worldConfig: IWorldConfig = {
  width: 224,
  height: 256,
} as const;
