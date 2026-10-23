import type { EventWriter } from "@/core/EventQueue";
import type { ScoreChangedEvent } from "@/core/WorldEvent";
import type { BrickKind } from "@/entities";

const BRICK_POINTS: Record<BrickKind, number> = {
  white: 50,
  orange: 60,
  "light-blue": 70,
  green: 80,
  red: 90,
  blue: 100,
  pink: 110,
  yellow: 120,
  silver: 0,
  gold: 0,
};

const CAPSULE_POINTS = 1000;

export class ScoreSystem {
  private currentScore = 0;

  constructor(private readonly events: EventWriter<ScoreChangedEvent>) {}

  get score(): number {
    return this.currentScore;
  }

  reset(): void {
    this.currentScore = 0;
  }

  awardBrick(kind: BrickKind, levelIndex: number): void {
    const points = kind === "silver" ? 50 * levelIndex : BRICK_POINTS[kind];
    this.addPoints(points);
  }

  awardCapsule(): void {
    this.addPoints(CAPSULE_POINTS);
  }

  private addPoints(points: number): void {
    if (points === 0) return;

    this.currentScore += points;
    this.events.emit({ type: "scoreChanged", score: this.currentScore });
  }
}
