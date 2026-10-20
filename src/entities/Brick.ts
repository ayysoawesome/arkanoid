export class Brick {
  static readonly WIDTH: number = 16;
  static readonly HEIGHT: number = 8;
  destroyed: boolean = false;

  constructor(readonly position: { x: number; y: number }) {}
}
