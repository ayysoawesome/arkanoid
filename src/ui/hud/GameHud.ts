import { Container, Sprite, Text, type Texture } from "pixi.js";
import { textStyles } from "@/theme/tokens";

const HUD_DESIGN_HEIGHT = 720;
const LIFE_ICON_WIDTH = 28;
const LIFE_ICON_HEIGHT = 8;
const LIFE_ICON_STEP = 34;

export class GameHud extends Container {
  private readonly highLabel = new Text({
    text: "HIGH",
    style: textStyles.hudLabel,
  });
  private readonly highScoreLabel = new Text({
    text: "SCORE",
    style: textStyles.hudLabel,
  });
  private readonly highScoreValue = new Text({
    text: "",
    style: textStyles.hudValue,
  });
  private readonly playerLabel = new Text({
    text: "1UP",
    style: textStyles.hudLabel,
  });
  private readonly scoreValue = new Text({
    text: "00",
    style: textStyles.hudValue,
  });
  private readonly livesView = new Container();
  private readonly roundLabel = new Text({
    text: "ROUND",
    style: textStyles.hudLabel,
  });
  private readonly roundValue = new Text({
    text: "1",
    style: textStyles.hudValue,
  });
  private highScore: number;

  constructor(
    private readonly lifeTexture: Texture,
    initialHighScore: number,
  ) {
    super();
    this.highScore = initialHighScore;
    this.highScoreValue.text = String(initialHighScore);

    this.highLabel.position.set(16, 22);
    this.highScoreLabel.position.set(28, 46);
    this.highScoreValue.position.set(28, 73);
    this.playerLabel.position.set(16, 126);
    this.scoreValue.position.set(28, 153);
    this.livesView.position.set(16, 360);
    this.roundLabel.position.set(16, 622);
    this.roundValue.anchor.set(1, 0);
    this.roundValue.position.set(144, 652);

    this.addChild(
      this.highLabel,
      this.highScoreLabel,
      this.highScoreValue,
      this.playerLabel,
      this.scoreValue,
      this.livesView,
      this.roundLabel,
      this.roundValue,
    );
  }

  resize(height: number): void {
    this.scale.set(height / HUD_DESIGN_HEIGHT);
  }

  setScore(score: number): void {
    const value = String(score).padStart(2, "0");
    if (this.scoreValue.text !== value) {
      this.scoreValue.text = value;
    }
    if (score > this.highScore) {
      this.highScore = score;
      this.highScoreValue.text = String(score);
    }
  }

  setLives(lives: number): void {
    const count = Math.max(0, lives);
    while (this.livesView.children.length < count) {
      const icon = new Sprite(this.lifeTexture);
      icon.setSize(LIFE_ICON_WIDTH, LIFE_ICON_HEIGHT);
      const index = this.livesView.children.length;
      icon.position.set(
        (index % 4) * LIFE_ICON_STEP,
        Math.floor(index / 4) * 16,
      );
      this.livesView.addChild(icon);
    }
    while (this.livesView.children.length > count) {
      const icon = this.livesView.removeChildAt(
        this.livesView.children.length - 1,
      );
      icon.destroy();
    }
  }

  setRound(round: number): void {
    const value = String(round);
    if (this.roundValue.text !== value) {
      this.roundValue.text = value;
    }
  }
}
