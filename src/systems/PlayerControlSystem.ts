import { fieldBounds } from "@/config";
import { Player } from "@/entities";

export class PlayerControlSystem {
  update({
    player,
    direction,
    targetX,
    dtSeconds,
    rightBoundary,
  }: {
    player: Player;
    direction: number;
    targetX: number | null;
    dtSeconds: number;
    rightBoundary: number;
  }) {
    const nextX =
      targetX ?? player.position.x + direction * player.speed * dtSeconds;
    const minX = fieldBounds.left + player.width / 2;
    const maxX = rightBoundary - player.width / 2;
    player.position.x = Math.max(minX, Math.min(maxX, nextX));
  }
}
