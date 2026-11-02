// Sprite sheets drawn outside the game (AI-generated on a flat magenta background, laid out on a grid).
// We key out the magenta, crop one cell per view (front / back / side), and fake the pose frames
// (breathing, wind-up lean, strike, crouch) by squashing and skewing that one drawing.
import { FRAMES, VIEWS } from './sprites.js';

export const RES = 2; // texture pixels per game pixel, so the art keeps some detail

const isKey = (r, g, b) => r - g > 70 && b - g > 70; // magenta, with slack for JPEG noise

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// One grid cell -> transparent, trimmed to the character, scaled to `h` game px tall (side art mirrored to face right).
function cutCell(img, sheet, [row, col], mirror) {
  const cols = Array.isArray(sheet.cols) ? sheet.cols[row] : sheet.cols;
  const cw = Math.floor(img.width / cols), ch = Math.floor(img.height / sheet.rows);
  const cell = canvas(cw, ch), ctx = cell.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, col * cw, row * ch, cw, ch, 0, 0, cw, ch);
  const data = ctx.getImageData(0, 0, cw, ch), d = data.data;
  const rowsHit = new Array(ch).fill(0), colsHit = new Array(cw).fill(0);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      if (isKey(d[i], d[i + 1], d[i + 2])) {
        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
      } else {
        rowsHit[y]++;
        colsHit[x]++;
      }
    }
  }
  // trim to rows/cols with real content, so stray specks bleeding in from a neighboring cell don't count
  const MIN = 4;
  const y0 = rowsHit.findIndex(n => n >= MIN), y1 = rowsHit.findLastIndex(n => n >= MIN);
  const x0 = colsHit.findIndex(n => n >= MIN), x1 = colsHit.findLastIndex(n => n >= MIN);
  if (x0 < 0 || y0 < 0) throw new Error(`empty cell ${row},${col} in ${sheet.file}`);
  ctx.putImageData(data, 0, 0);
  const h = sheet.h * RES, w = Math.round(((x1 - x0 + 1) * h) / (y1 - y0 + 1));
  const out = canvas(w, h), o = out.getContext('2d');
  o.imageSmoothingQuality = 'high';
  if (mirror) {
    o.translate(w, 0);
    o.scale(-1, 1);
  }
  o.drawImage(cell, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, w, h);
  // smoothing leaves soft edges; snap alpha back to hard pixel edges
  const od = o.getImageData(0, 0, w, h);
  for (let i = 3; i < od.data.length; i += 4) od.data[i] = od.data[i] > 110 ? 255 : 0;
  o.putImageData(od, 0, 0);
  return out;
}

// sy: vertical squash, sx: horizontal stretch, k: lean (side view only; positive leans forward)
const POSES = {
  idle1: { sy: 0.985 }, idle2: { sy: 0.975 }, idle3: { sy: 0.985 },
  windup: { sy: 0.94, k: -0.14 }, smear: { k: 0.2, sx: 1.05 }, strike: { k: 0.12, sx: 1.04 },
  hurt: { sy: 0.96, k: -0.12 }, down: { sy: 0.58, sx: 1.08 },
};

// Every pose of one view on the same-size canvas, so swapping frames never resizes the sprite.
function poseCanvas(base, frame, view, W) {
  const p = POSES[frame] ?? {}, k = view === 'side' ? p.k ?? 0 : 0, H = base.height;
  const c = canvas(W, H), ctx = c.getContext('2d');
  ctx.translate(W / 2, H); // origin at the feet, so squash and lean pivot on the floor
  ctx.transform(1, 0, -k, 1, 0, 0);
  ctx.scale(p.sx ?? 1, p.sy ?? 1);
  ctx.drawImage(base, -base.width / 2, -base.height);
  return c;
}

// units: anything with { sprite, sheet }. Returns Map sprite id -> { frames[view][frame]: canvas }.
export async function loadArt(units) {
  const art = new Map();
  await Promise.all(units.filter(u => u.sheet).map(async u => {
    const { sheet } = u, img = await loadImage(sheet.file);
    const bases = Object.fromEntries(VIEWS.map(v => [v, cutCell(img, sheet, sheet[v], v === 'side' && sheet.sideFacesLeft)]));
    const W = Math.ceil(Math.max(...VIEWS.map(v => bases[v].width)) * 1.3); // room to lean without clipping
    const frames = Object.fromEntries(VIEWS.map(v => [v, Object.fromEntries(FRAMES.map(f => [f, poseCanvas(bases[v], f, v, W)]))]));
    art.set(u.sprite, { frames });
  }));
  return art;
}
