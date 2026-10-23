import { PowerUp, POWER_UP_KINDS, type PowerUpKind } from "@/entities";
import type { BrickDestroyedEvent } from "@/core/WorldEvent";

export class PowerUpSystem {
  handleBrickDestroyed(event: BrickDestroyedEvent, powerUps: PowerUp[]): void {
    if (!event.canDropCapsule || powerUps.length > 0) return;

    powerUps.push(new PowerUp(event.position, this.selectKind()));
  }

  private selectKind(): PowerUpKind {
    const index = Math.floor(Math.random() * POWER_UP_KINDS.length);
    return POWER_UP_KINDS[index];
  }

  update({
    powerUpArr,
    dtSeconds,
  }: {
    powerUpArr: PowerUp[];
    dtSeconds: number;
  }) {
    for (let i = powerUpArr.length - 1; i >= 0; i--) {
      const powerUp = powerUpArr[i];
      powerUp.fall(dtSeconds);

      if (powerUp.shouldDestroy()) {
        powerUpArr.splice(i, 1);
      }
    }
  }
}
