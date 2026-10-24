export type PlayerPhaseKind = "spawn" | "destroy";

export type PlayerPhaseFrame = Readonly<{
  kind: PlayerPhaseKind;
  frame: number;
}>;
