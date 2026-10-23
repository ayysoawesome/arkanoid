import { PowerUp, POWER_UP_KINDS, type PowerUpKind, Player } from "@/entities";
import type { BrickDestroyedEvent, PowerUpCollectedEvent } from "@/core";
import { type EventWriter } from "@/core";

export class PowerUpSystem {
  constructor(private readonly events: EventWriter<PowerUpCollectedEvent>) {}

  update({
    player,
    powerUpArr,
    dtSeconds,
  }: {
    player: Player;
    powerUpArr: PowerUp[];
    dtSeconds: number;
  }) {
    for (let i = powerUpArr.length - 1; i >= 0; i--) {
      const powerUp = powerUpArr[i];
      powerUp.fall(dtSeconds);

      if (this.isCaught(powerUp, player)) {
        powerUpArr.splice(i, 1);
        this.events.emit({
          type: "powerUpCollected",
          kind: powerUp.kind,
        });
        continue;
      }

      if (powerUp.shouldDestroy()) {
        powerUpArr.splice(i, 1);
      }
    }
  }

  private isCaught(powerUp: PowerUp, player: Player): boolean {
    return (
      Math.abs(powerUp.position.x - player.position.x) <=
        (PowerUp.WIDTH + player.width) / 2 &&
      Math.abs(powerUp.position.y - player.position.y) <=
        (PowerUp.HEIGHT + player.height) / 2
    );
  }

  handleBrickDestroyed(event: BrickDestroyedEvent, powerUps: PowerUp[]): void {
    if (!event.canDropCapsule || powerUps.length > 0) return;

    powerUps.push(new PowerUp(event.position, this.selectKind()));
  }

  private selectKind(): PowerUpKind {
    const index = Math.floor(Math.random() * POWER_UP_KINDS.length);
    return POWER_UP_KINDS[index];
  }
}
