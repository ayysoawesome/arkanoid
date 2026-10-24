import { PowerUp, POWER_UP_KINDS, type PowerUpKind, Player } from "@/entities";
import type { BrickDestroyedEvent, PowerUpCollectedEvent } from "@/core";
import { type EventWriter } from "@/core";

const POWER_UP_WEIGHTS = {
  laser: 4,
  expand: 5,
  catch: 4,
  disrupt: 3,
  slow: 4,
  break: 2,
  player: 1,
} satisfies Record<PowerUpKind, number>;

type DropContext = {
  player: Player;
  ballCount: number;
  exitOpen: boolean;
  slowActive: boolean;
};

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

  handleBrickDestroyed(
    event: BrickDestroyedEvent,
    powerUps: PowerUp[],
    { player, ballCount, exitOpen, slowActive }: DropContext,
  ): void {
    if (!event.canDropCapsule || powerUps.length > 0) return;

    const availableKinds = POWER_UP_KINDS.filter((kind) => {
      if (kind === "expand" || kind === "catch" || kind === "laser") {
        return player.mode !== (kind === "expand" ? "expanded" : kind);
      }
      if (kind === "disrupt") return ballCount === 1;
      if (kind === "slow") return !slowActive;
      if (kind === "break") return !exitOpen;
      return true;
    });
    if (availableKinds.length === 0) return;

    powerUps.push(new PowerUp(event.position, this.selectKind(availableKinds)));
  }

  private selectKind(availableKinds: readonly PowerUpKind[]): PowerUpKind {
    const totalWeight = availableKinds.reduce(
      (total, kind) => total + POWER_UP_WEIGHTS[kind],
      0,
    );
    let roll = Math.random() * totalWeight;
    for (const kind of availableKinds) {
      roll -= POWER_UP_WEIGHTS[kind];
      if (roll < 0) return kind;
    }
    return availableKinds[availableKinds.length - 1];
  }
}
