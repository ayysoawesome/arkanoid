import { BrickKind } from "@/entities";

export interface LevelDef {
  index: number;
  bricks: BrickDef[];
}

export interface BrickDef {
  row: number;
  column: number;
  kind: BrickKind;
}
