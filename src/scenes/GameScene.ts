import {
  Controls,
  type ControlBindings,
  GameAssets,
  GameWorld,
  InputManager,
  Scene,
} from "@/core";
import { WorldView } from "@/rendering";
import { GameHud } from "@/ui/hud";
import { worldConfig } from "@/config";
import { DefeatOverlay } from "@/ui/overlays";

type GameAction = "moveLeft" | "moveRight" | "launch" | "returnToMenu";
type ControlMode = "playing" | "result";

export class GameScene extends Scene {
  private readonly world = new GameWorld();
  private readonly controls: Controls<GameAction>;
  private controlMode: ControlMode = "playing";
  private direction = 0;
  private launchRequested = false;
  private readonly playingBindings: ControlBindings<GameAction> = {
    moveLeft: {
      key: "ArrowLeft",
      when: "held",
      handle: () => {
        this.direction--;
      },
    },
    moveRight: {
      key: "ArrowRight",
      when: "held",
      handle: () => {
        this.direction++;
      },
    },
    launch: {
      key: "Space",
      when: "pressed",
      handle: () => {
        this.launchRequested = true;
      },
    },
  };
  private readonly resultBindings: ControlBindings<GameAction> = {
    returnToMenu: {
      key: "Space",
      when: "pressed",
      handle: () => this.onReturnToMenu(),
    },
  };
  private readonly worldView: WorldView;
  private readonly hud = new GameHud();
  private readonly defeatOverlay = new DefeatOverlay();

  constructor(
    inputManager: InputManager,
    assets: GameAssets,
    private readonly onReturnToMenu: () => void,
  ) {
    super();

    this.controls = new Controls(inputManager, this.playingBindings);

    this.worldView = new WorldView(
      this.world.player,
      this.world.ball,
      this.world.bricks,
      assets,
    );
    this.hud.setLives(this.world.lives);

    this.addChild(this.worldView, this.hud, this.defeatOverlay);
  }

  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;

    const scale = height / worldConfig.height;

    const gameField = {
      width: worldConfig.width * scale,
      height: worldConfig.height * scale,
    };

    this.worldView.scale.set(scale);
    this.worldView.position.set(0, 0);
    this.hud.position.set(gameField.width, 0);

    this.defeatOverlay.resize(width, height);
  }

  private syncOverlays() {
    this.defeatOverlay.visible = this.world.status === "defeat";
  }

  private syncControls(): void {
    const mode = this.world.status === "playing" ? "playing" : "result";
    if (mode === this.controlMode) return;

    this.controlMode = mode;
    this.controls.setBindings(
      mode === "playing" ? this.playingBindings : this.resultBindings,
    );
  }

  update(dtSeconds: number): void {
    this.direction = 0;
    this.launchRequested = false;
    this.controls.update();
    if (this.controlMode === "result") return;

    this.world.update({
      direction: this.direction,
      spacePressed: this.launchRequested,
      dtSeconds,
    });
    this.hud.setLives(this.world.lives);
    this.worldView.sync({
      player: this.world.player,
      ball: this.world.ball,
      bricks: this.world.bricks,
    });
    this.syncOverlays();
    this.syncControls();
  }
}
