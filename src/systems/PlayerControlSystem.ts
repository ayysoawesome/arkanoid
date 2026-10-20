import { worldConfig } from "@/config";
import { Player } from "@/entities";

export class PlayerControlSystem {
  update(player: Player, direction: number, dtSeconds: number) {
    const halfWidth = player.width / 2;
    const nextX = player.position.x + direction * player.speed * dtSeconds;

    player.position.x = Math.max(
      halfWidth,
      Math.min(worldConfig.width - halfWidth, nextX),
    );
  }
}
