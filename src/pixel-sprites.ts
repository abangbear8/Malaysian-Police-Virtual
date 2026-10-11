/**

* Malaysian Police Virtual — Pixel Art Sprite Loader
* Memuatkan sprite SVG dan melukisnya pada Canvas.
    */

export type SpriteName =
| ‘tree’
| ‘palm’
| ‘house’
| ‘shop’
| ‘station’
| ‘policecar’
| ‘car’
| ‘officer’
| ‘civilian’
| ‘bike’
| ‘lamp’
| ‘bush’;

const SPRITES: Record<SpriteName, [number, number]> = {
tree: [0, 0],
palm: [64, 0],
house: [128, 0],
shop: [192, 0],
station: [256, 0],
policecar: [320, 0],
car: [0, 64],
officer: [64, 64],
civilian: [128, 64],
bike: [192, 64],
lamp: [256, 64],
bush: [320, 64],
};

const atlas = new Image();
atlas.src = ‘/mpv-pixel-atlas.svg’;

let loaded = false;

atlas.onload = () => {
loaded = true;
};

export function drawSprite(
ctx: CanvasRenderingContext2D,
name: SpriteName,
x: number,
y: number,
width = 64,
height = 64,
): boolean {
if (!loaded) return false;

const [sx, sy] = SPRITES[name];

ctx.save();
ctx.imageSmoothingEnabled = false;

ctx.drawImage(
atlas,
sx, sy, 64, 64,
Math.round(x), Math.round(y),
width, height,
);

ctx.restore();
return true;
}

export function isSpriteAtlasLoaded(): boolean {
return loaded;
}
