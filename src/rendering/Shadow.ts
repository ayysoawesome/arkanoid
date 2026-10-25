import { AnimatedSprite, Container, Sprite, type Texture } from "pixi.js";

export const SHADOW_COLOR = 0x000000;
export const SHADOW_ALPHA = 0.6;
export const SHADOW_OFFSET = 2;

export function createSpriteShadow(source: Sprite): Sprite {
  const shadow = new Sprite({
    texture: source.texture,
    anchor: { x: source.anchor.x, y: source.anchor.y },
  });
  shadow.position.set(source.x + SHADOW_OFFSET, source.y + SHADOW_OFFSET);
  shadow.tint = SHADOW_COLOR;
  shadow.alpha = SHADOW_ALPHA;

  if (source instanceof AnimatedSprite) {
    const onFrameChange = source.onFrameChange;
    source.onFrameChange = (frame) => {
      shadow.texture = source.texture;
      onFrameChange?.(frame);
    };
  }

  return shadow;
}

export function createShadowedSprite(texture: Texture): Container {
  const body = new Sprite({ texture, anchor: 0.5 });
  const view = new Container();
  view.addChild(createSpriteShadow(body), body);
  return view;
}
