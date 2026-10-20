import { fieldBounds } from "@/config";
import { Player } from "@/entities";

export class PlayerControlSystem {
  update({
    player,
    direction,
    dtSeconds,
  }: {
    player: Player;
    direction: number;
    dtSeconds: number;
  }) {
    const nextX = player.position.x + direction * player.speed * dtSeconds;
    const minX = fieldBounds.left + player.width / 2;
    const maxX = fieldBounds.right - player.width / 2;
    player.position.x = Math.max(minX, Math.min(maxX, nextX));
  }
}
