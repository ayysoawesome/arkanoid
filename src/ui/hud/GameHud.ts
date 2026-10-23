import { Container, Text } from "pixi.js";

export class GameHud extends Container {
  private readonly scoreLabel = new Text({
    text: "SCORE",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 20,
      fill: "#ffffff",
    },
  });

  private readonly scoreValue = new Text({
    text: "",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 28,
      fill: "#ffffff",
    },
  });

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

  private readonly roundLabel = new Text({
    text: "ROUND",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 20,
      fill: "#ffffff",
    },
  });

  private readonly roundValue = new Text({
    text: "",
    style: {
      fontFamily: "PixelOperator8",
      fontSize: 28,
      fill: "#ffffff",
    },
  });

  constructor() {
    super();

    this.scoreLabel.position.set(16, 16);
    this.scoreValue.position.set(16, 40);
    this.livesLabel.position.set(16, 88);
    this.livesValue.position.set(16, 112);
    this.addChild(
      this.scoreLabel,
      this.scoreValue,
      this.livesLabel,
      this.livesValue,
      this.roundLabel,
      this.roundValue,
    );
  }

  resize(height: number): void {
    this.roundLabel.position.set(16, height - 72);
    this.roundValue.position.set(16, height - 48);
  }

  setScore(score: number): void {
    const value = String(score);
    if (this.scoreValue.text !== value) {
      this.scoreValue.text = value;
    }
  }

  setLives(lives: number): void {
    const value = String(lives);
    if (this.livesValue.text !== value) {
      this.livesValue.text = value;
    }
  }

  setRound(round: number): void {
    const value = String(round);
    if (this.roundValue.text !== value) {
      this.roundValue.text = value;
    }
  }
}
