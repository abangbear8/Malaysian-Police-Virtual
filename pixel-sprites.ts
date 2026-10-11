/**
 * Malaysian Police Virtual — pixel sprite atlas loader.
 * Import this module from src/main.ts and draw sprites with drawSprite().
 * Atlas is a 384x128 SVG; each sprite uses a 64x64 cell.
 */
export type MvpSpriteName =
  | "tree" | "palm" | "house" | "shop" | "station" | "policecar"
  | "car" | "officer" | "civilian" | "bike" | "lamp" | "bush";

const CELLS: Record<MvpSpriteName, [number, number]> = {
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
atlas.src = "/assets/mpv-pixel-atlas.svg";
let atlasReady = false;
let atlasFailed = false;

atlas.onload = () => { atlasReady = true; };
atlas.onerror = () => { atlasFailed = true; };

export function pixelAtlasStatus(): "loading" | "ready" | "failed" {
  return atlasReady ? "ready" : atlasFailed ? "failed" : "loading";
}

/** Draws one 64x64 sprite into the supplied CanvasRenderingContext2D. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: MvpSpriteName,
  x: number,
  y: number,
  width = 64,
  height = 64,
): boolean {
  if (!atlasReady) return false;
  const [sx, sy] = CELLS[name];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas, sx, sy, 64, 64, Math.round(x), Math.round(y), width, height);
  ctx.restore();
  return true;
}
