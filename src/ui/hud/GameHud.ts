import { Container, Text } from "pixi.js";

export class GameHud extends Container {
  private readonly livesLabel = new Text({
    text: "LIVES",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 20,
      fill: "#ffffff",
    },
  });

  private readonly livesValue = new Text({
    text: "",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 28,
      fill: "#ffffff",
    },
  });
  constructor() {
    super();

    this.livesLabel.position.set(16, 16);
    this.livesValue.position.set(16, 40);
    this.addChild(this.livesLabel, this.livesValue);
  }

  setLives(lives: number): void {
    const value = String(lives);
    if (this.livesValue.text !== value) {
      this.livesValue.text = value;
    }
  }
}
