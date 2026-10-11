
/**
 * Malaysian Police Virtual
 * Pixel Art Sprite Loader
 */

export type SpriteName =
  | 'tree'
  | 'palm'
  | 'house'
  | 'shop'
  | 'station'
  | 'policecar'
  | 'car'
  | 'officer'
  | 'civilian'
  | 'bike'
  | 'lamp'
  | 'bush';

type SpritePosition = {
  x: number;
  y: number;
};

const SPRITES: Record<SpriteName, SpritePosition> = {
  tree: { x: 0, y: 0 },
  palm: { x: 64, y: 0 },
  house: { x: 128, y: 0 },
  shop: { x: 192, y: 0 },
  station: { x: 256, y: 0 },
  policecar: { x: 320, y: 0 },
  car: { x: 0, y: 64 },
  officer: { x: 64, y: 64 },
  civilian: { x: 128, y: 64 },
  bike: { x: 192, y: 64 },
  lamp: { x: 256, y: 64 },
  bush: { x: 320, y: 64 },
};

const atlas = new Image();

let loaded = false;

atlas.onload = (): void => {
  loaded = true;
};

atlas.onerror = (): void => {
  loaded = false;
};

atlas.src = '/mpv-pixel-atlas.svg';

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: SpriteName,
  x: number,
  y: number,
  width: number = 64,
  height: number = 64,
): boolean {
  if (!loaded) {
    return false;
  }

  const sprite = SPRITES[name];

  if (!sprite) {
    return false;
  }

  ctx.save();

  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(
    atlas,
    sprite.x,
    sprite.y,
    64,
    64,
    Math.round(x),
    Math.round(y),
    width,
    height,
  );

  ctx.restore();

  return true;
}

export function isSpriteAtlasLoaded(): boolean {
  return loaded;
}
