import type { Brick } from "@/entities";
import type { EventWriter } from "@/core/EventQueue";
import type { BrickDestroyedEvent } from "@/core/WorldEvent";

export class BrickSystem {
  constructor(private readonly events: EventWriter<BrickDestroyedEvent>) {}

  handleHit(brick: Brick): void {
    if (brick.destroyed) return;

    brick.hit();
    if (!brick.destroyed) return;

    this.events.emit({
      type: "brickDestroyed",
      brickKind: brick.kind,
      canDropCapsule: brick.canDropCapsule,
      position: { ...brick.position },
    });
  }
}
