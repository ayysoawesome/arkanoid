import { LevelDef } from "./types";

export const level1: LevelDef = {
  index: 1,
  bricks: [
    { row: 0, column: 0, kind: "silver" },
    { row: 0, column: 1, kind: "silver", canDropCapsule: true },
    { row: 0, column: 2, kind: "silver" },
    { row: 0, column: 3, kind: "silver" },
    { row: 0, column: 4, kind: "silver", canDropCapsule: true },
    { row: 0, column: 5, kind: "silver" },
    { row: 0, column: 6, kind: "silver", canDropCapsule: true },
    { row: 0, column: 7, kind: "silver" },
    { row: 0, column: 8, kind: "silver" },
    { row: 0, column: 9, kind: "silver" },
    { row: 0, column: 10, kind: "silver" },
    { row: 1, column: 0, kind: "red", canDropCapsule: true },
    { row: 1, column: 1, kind: "red" },
    { row: 1, column: 2, kind: "red" },
    { row: 1, column: 3, kind: "red" },
    { row: 1, column: 4, kind: "red" },
    { row: 1, column: 5, kind: "red", canDropCapsule: true },
    { row: 1, column: 6, kind: "red" },
    { row: 1, column: 7, kind: "red" },
    { row: 1, column: 8, kind: "red" },
    { row: 1, column: 9, kind: "red" },
    { row: 1, column: 10, kind: "red" },
  ],
};

export const level2: LevelDef = {
  index: 2,
  bricks: [
    { row: 1, column: 0, kind: "red" },
    { row: 0, column: 1, kind: "red" },
  ],
};
