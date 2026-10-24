import { Controls, InputManager, Scene } from "@/core";
import { levels } from "@/levels";
import { textStyles } from "@/theme/tokens";
import { createMenuLabel } from "@/ui/menu/createMenuLabel";
import { MenuButton } from "@/ui/menu/MenuButton";
import { Container, Graphics, Rectangle } from "pixi.js";

const COLUMNS = 7;
const TILE_WIDTH = 80;
const TILE_HEIGHT = 52;
const GAP = 12;
const GRID_WIDTH = COLUMNS * TILE_WIDTH + (COLUMNS - 1) * GAP;
const GRID_HEIGHT =
  Math.ceil(levels.length / COLUMNS) * TILE_HEIGHT +
  (Math.ceil(levels.length / COLUMNS) - 1) * GAP;

type SelectAction = "left" | "right" | "up" | "down" | "confirm" | "back";

class LevelTile extends Container {
  private readonly background = new Graphics();
  private readonly numberText: ReturnType<typeof createMenuLabel>;

  constructor(
    levelIndex: number,
    onActivate: () => void,
    onSelect: () => void,
  ) {
    super();
    this.numberText = createMenuLabel(String(levelIndex), textStyles.levelTile);
    this.addChild(this.background, this.numberText);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.hitArea = new Rectangle(
      -TILE_WIDTH / 2,
      -TILE_HEIGHT / 2,
      TILE_WIDTH,
      TILE_HEIGHT,
    );
    this.on("pointerover", onSelect);
    this.on("pointertap", (event) => {
      event.stopPropagation();
      onActivate();
    });
  }

  setSelected(selected: boolean): void {
    this.background
      .clear()
      .rect(-TILE_WIDTH / 2, -TILE_HEIGHT / 2, TILE_WIDTH, TILE_HEIGHT)
      .fill({ color: selected ? 0x6b2020 : 0x171717 })
      .stroke({ color: selected ? 0xff6666 : 0x777777, width: 2 });
  }
}

export class LevelSelectScene extends Scene {
  private readonly controls: Controls<SelectAction>;
  private readonly content = new Container();
  private readonly title = createMenuLabel(
    "SELECT LEVEL",
    textStyles.controlsTitle,
  );
  private readonly tiles: LevelTile[];
  private readonly backButton: MenuButton;
  private selectedIndex: number;
  private lastLevelIndex: number;

  constructor(
    inputManager: InputManager,
    private readonly onStartLevel: (index: number) => void,
    private readonly onBack: () => void,
    initialLevelIndex = levels[0]?.index,
  ) {
    super();
    const initialIndex = levels.findIndex(
      (level) => level.index === initialLevelIndex,
    );
    this.selectedIndex = Math.max(0, initialIndex);
    this.lastLevelIndex = this.selectedIndex;

    this.controls = new Controls(inputManager, {
      left: {
        key: "ArrowLeft",
        when: "pressed",
        handle: () => this.moveSelection(-1, 0),
      },
      right: {
        key: "ArrowRight",
        when: "pressed",
        handle: () => this.moveSelection(1, 0),
      },
      up: {
        key: "ArrowUp",
        when: "pressed",
        handle: () => this.moveSelection(0, -1),
      },
      down: {
        key: "ArrowDown",
        when: "pressed",
        handle: () => this.moveSelection(0, 1),
      },
      confirm: {
        key: "Space",
        when: "pressed",
        handle: () => this.confirmSelection(),
      },
      back: {
        key: "Escape",
        when: "pressed",
        handle: this.onBack,
      },
    });

    this.title.y = -GRID_HEIGHT / 2 - 54;
    this.tiles = levels.map((level, index) => {
      const tile = new LevelTile(
        level.index,
        () => this.onStartLevel(level.index),
        () => this.select(index),
      );
      tile.position.set(
        -GRID_WIDTH / 2 +
          TILE_WIDTH / 2 +
          (index % COLUMNS) * (TILE_WIDTH + GAP),
        -GRID_HEIGHT / 2 +
          TILE_HEIGHT / 2 +
          Math.floor(index / COLUMNS) * (TILE_HEIGHT + GAP),
      );
      return tile;
    });
    this.backButton = new MenuButton("BACK", this.onBack, () =>
      this.select(this.tiles.length),
    );
    this.backButton.y = GRID_HEIGHT / 2 + 54;

    this.content.addChild(this.title, ...this.tiles, this.backButton);
    this.addChild(this.content);
    this.updateSelection();
  }

  resize(width: number, height: number): void {
    const scale = Math.min(
      1,
      (width - 24) / GRID_WIDTH,
      (height - 24) / (GRID_HEIGHT + 150),
    );
    this.content.scale.set(Math.max(0, scale));
    this.content.position.set(width / 2, height / 2);
  }

  update(): void {
    this.controls.update();
  }

  private select(index: number): void {
    this.selectedIndex = index;
    if (index < this.tiles.length) this.lastLevelIndex = index;
    this.updateSelection();
  }

  private moveSelection(horizontal: number, vertical: number): void {
    if (this.selectedIndex === this.tiles.length) {
      if (vertical < 0) this.select(this.lastLevelIndex);
      return;
    }

    const column = this.selectedIndex % COLUMNS;
    const row = Math.floor(this.selectedIndex / COLUMNS);
    const nextColumn = column + horizontal;
    const nextRow = row + vertical;
    if (vertical > 0 && nextRow * COLUMNS >= this.tiles.length) {
      this.select(this.tiles.length);
      return;
    }
    if (
      nextColumn < 0 ||
      nextColumn >= COLUMNS ||
      nextRow < 0 ||
      nextRow * COLUMNS + nextColumn >= this.tiles.length
    ) {
      return;
    }
    this.select(nextRow * COLUMNS + nextColumn);
  }

  private updateSelection(): void {
    this.tiles.forEach((tile, index) =>
      tile.setSelected(index === this.selectedIndex),
    );
    this.backButton.setSelected(this.selectedIndex === this.tiles.length);
  }

  private confirmSelection(): void {
    if (this.selectedIndex === this.tiles.length) {
      this.onBack();
    } else {
      this.onStartLevel(levels[this.selectedIndex].index);
    }
  }
}
