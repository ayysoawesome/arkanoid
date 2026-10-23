import type { EventWriter } from "@/core/EventQueue";
import type { BrickHitEvent } from "@/core/WorldEvent";
import { Brick, LaserShot, Player } from "@/entities";

const SHOT_COOLDOWN_SECONDS = 0.2;
const MUZZLE_INSET = 4;

export class LaserSystem {
  private cooldownRemaining = 0;

  constructor(private readonly events: EventWriter<BrickHitEvent>) {}

  update({
    shots,
    player,
    bricks,
    fireRequested,
    dtSeconds,
  }: {
    shots: LaserShot[];
    player: Player;
    bricks: readonly Brick[];
    fireRequested: boolean;
    dtSeconds: number;
  }): void {
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dtSeconds);

    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.advance(dtSeconds);

      if (shot.shouldDestroy()) {
        shots.splice(i, 1);
        continue;
      }

      const brick = this.findHitBrick(shot, bricks);
      if (brick) {
        shots.splice(i, 1);
        this.events.emit({ type: "brickHit", brick });
      }
    }

    if (
      fireRequested &&
      player.mode === "laser" &&
      this.cooldownRemaining === 0
    ) {
      this.fire(player, shots);
      this.cooldownRemaining = SHOT_COOLDOWN_SECONDS;
    }
  }

  reset(): void {
    this.cooldownRemaining = 0;
  }

  private fire(player: Player, shots: LaserShot[]): void {
    const offsetX = player.width / 2 - MUZZLE_INSET;
    const y = player.position.y - player.height / 2 - LaserShot.HEIGHT / 2;
    shots.push(new LaserShot({ x: player.position.x - offsetX, y }));
    shots.push(new LaserShot({ x: player.position.x + offsetX, y }));
  }

  private findHitBrick(
    shot: LaserShot,
    bricks: readonly Brick[],
  ): Brick | undefined {
    let closestBrick: Brick | undefined;

    for (const brick of bricks) {
      if (brick.destroyed) continue;

      const overlaps =
        shot.position.x + LaserShot.WIDTH / 2 >
          brick.position.x - Brick.WIDTH / 2 &&
        shot.position.x - LaserShot.WIDTH / 2 <
          brick.position.x + Brick.WIDTH / 2 &&
        shot.position.y + LaserShot.HEIGHT / 2 >
          brick.position.y - Brick.HEIGHT / 2 &&
        shot.position.y - LaserShot.HEIGHT / 2 <
          brick.position.y + Brick.HEIGHT / 2;

      if (
        overlaps &&
        (!closestBrick || brick.position.y > closestBrick.position.y)
      ) {
        closestBrick = brick;
      }
    }

    return closestBrick;
  }
}
