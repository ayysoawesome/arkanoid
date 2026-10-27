import { sound } from "@pixi/sound";

const effects = {
  playerHit: { file: "player-hit.wav", volume: 0.35 },
  loseBall: { file: "lose-ball.wav", volume: 0.5 },
  laserShot: { file: "laser-shot.wav", volume: 0.25 },
  gainLife: { file: "gain-life.wav", volume: 0.5 },
  expand: { file: "expand.wav", volume: 0.45 },
  enemyDestroy: { file: "enemy-destroy.wav", volume: 0.4 },
  brickHit: { file: "brick-hit.wav", volume: 0.3 },
  brickDestroy: { file: "brick-destroy.wav", volume: 0.35 },
  roundStart: { file: "round-start.mp3", volume: 0.45 },
  gameOver: { file: "game-over.mp3", volume: 0.5 },
} as const;

export type GameSound = keyof typeof effects;

export class GameAudio {
  get muted(): boolean {
    return sound.context.muted;
  }

  toggleMuted(): boolean {
    return sound.toggleMuteAll();
  }

  private readonly unlock = (): void => {
    if (!sound.supported || sound.context.audioContext.state === "running") {
      this.removeUnlockListeners();
      return;
    }

    void sound.context.audioContext
      .resume()
      .then(() => this.removeUnlockListeners())
      .catch(() => {});
  };

  constructor() {
    window.addEventListener("pointerdown", this.unlock);
    window.addEventListener("keydown", this.unlock);

    for (const [name, effect] of Object.entries(effects)) {
      sound.add(name, {
        url: `/sounds/${effect.file}`,
        preload: true,
        volume: effect.volume,
        loaded: (error) => {
          if (error) console.warn(`Could not load sound: ${name}`, error);
        },
      });
    }
    sound.volumeAll = 0.15;
  }

  play(name: GameSound): void {
    const playback = sound.play(name);
    if (playback instanceof Promise) {
      void playback.catch((error: unknown) => {
        console.warn(`Could not play sound: ${name}`, error);
      });
    }
  }

  stop(): void {
    sound.stopAll();
  }

  destroy(): void {
    this.removeUnlockListeners();
    sound.removeAll();
  }

  private removeUnlockListeners(): void {
    window.removeEventListener("pointerdown", this.unlock);
    window.removeEventListener("keydown", this.unlock);
  }
}
