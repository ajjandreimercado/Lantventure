// Sprite sheets drawn outside the game (AI-generated on a flat magenta background).
// - The base sheet is a grid; we crop one cell per view (front / back / side) and fake the pose frames
//   (breathing, wind-up lean, strike, crouch) by squashing and skewing that one drawing.
// - Optional animation strips (one row of frames each) replace those fakes with real frames, per view.
// - Optional cut-in art (portrait, eyes, baton pass, all-out...) is used as-is for the 2D overlays.
import { FRAMES, VIEWS } from './sprites.js';

export const RES = 2; // texture pixels per game pixel, so the art keeps some detail
const DIR = 'assets/sprites/';

const isKey = (r, g, b) => r - g > 70 && b - g > 70; // magenta, with slack for JPEG noise
const MIN = 4; // a row/column needs this many opaque pixels to count, so stray specks don't widen crops

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

const canvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// Whole image with the magenta made transparent, plus its pixel data for measuring.
function keyed(img) {
  const c = canvas(img.width, img.height), ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height), d = data.data;
  for (let i = 0; i < d.length; i += 4) if (isKey(d[i], d[i + 1], d[i + 2])) d[i + 3] = 0;
  ctx.putImageData(data, 0, 0);
  return { c, d, w: c.width, h: c.height };
}

// Opaque-pixel counts per row and per column inside a rectangle.
function hits(k, x0, y0, x1, y1) {
  const rows = new Array(k.h).fill(0), cols = new Array(k.w).fill(0);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (k.d[(y * k.w + x) * 4 + 3]) {
        rows[y]++;
        cols[x]++;
      }
    }
  }
  return { rows, cols };
}

// Smoothed scaling leaves soft edges; snap alpha back to hard pixel edges.
function harden(c) {
  const ctx = c.getContext('2d'), img = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
  ctx.putImageData(img, 0, 0);
  return c;
}

// The whole image trimmed to its content, full resolution (cut-in art).
function trimmed(k) {
  const { rows, cols } = hits(k, 0, 0, k.w, k.h);
  const y0 = rows.findIndex(n => n >= MIN), y1 = rows.findLastIndex(n => n >= MIN);
  const x0 = cols.findIndex(n => n >= MIN), x1 = cols.findLastIndex(n => n >= MIN);
  const out = canvas(x1 - x0 + 1, y1 - y0 + 1);
  out.getContext('2d').drawImage(k.c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

// One grid cell -> trimmed to the character, scaled to `h` game px tall (side art mirrored to face right).
function cutCell(k, sheet, [row, col], mirror) {
  const cols = Array.isArray(sheet.cols) ? sheet.cols[row] : sheet.cols;
  const cw = Math.floor(k.w / cols), ch = Math.floor(k.h / sheet.rows), cx0 = col * cw, cy0 = row * ch;
  const { rows, cols: colHits } = hits(k, cx0, cy0, cx0 + cw, cy0 + ch);
  const y0 = rows.findIndex(n => n >= MIN), y1 = rows.findLastIndex(n => n >= MIN);
  const x0 = colHits.findIndex(n => n >= MIN), x1 = colHits.findLastIndex(n => n >= MIN);
  if (x0 < 0 || y0 < 0) throw new Error(`empty cell ${row},${col} in ${sheet.file}`);
  const h = sheet.h * RES, w = Math.round(((x1 - x0 + 1) * h) / (y1 - y0 + 1));
  const out = canvas(w, h), o = out.getContext('2d');
  o.imageSmoothingQuality = 'high';
  if (mirror) {
    o.translate(w, 0);
    o.scale(-1, 1);
  }
  o.drawImage(k.c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, w, h);
  return harden(out);
}

// sy: vertical squash, sx: horizontal stretch, k: lean (side view only; positive leans forward)
const POSES = {
  idle1: { sy: 0.985 }, idle2: { sy: 0.975 }, idle3: { sy: 0.985 },
  windup: { sy: 0.94, k: -0.14 }, smear: { k: 0.2, sx: 1.05 }, strike: { k: 0.12, sx: 1.04 },
  hurt: { sy: 0.96, k: -0.12 }, down: { sy: 0.58, sx: 1.08 },
};

// A faked pose of one view, feet at the bottom center of the character's shared W x H canvas.
function poseCanvas(base, frame, view, W, H) {
  const p = POSES[frame] ?? {}, k = view === 'side' ? p.k ?? 0 : 0;
  const c = canvas(W, H), ctx = c.getContext('2d');
  ctx.translate(W / 2, H); // origin at the feet, so squash and lean pivot on the floor
  ctx.transform(1, 0, -k, 1, 0, 0);
  ctx.scale(p.sx ?? 1, p.sy ?? 1);
  ctx.drawImage(base, -base.width / 2, -base.height);
  return c;
}

// Split a strip of n frames. AI output isn't evenly spaced, so each cut goes in the emptiest column near the even
// split. Each frame is then anchored by its feet (center of its lowest rows) on the strip's shared baseline, so
// playing the frames back doesn't jitter.
function stripFrames(k, n, scale, W, H) {
  const { cols } = hits(k, 0, 0, k.w, k.h);
  const cuts = [0];
  for (let i = 1; i < n; i++) {
    const ideal = Math.round((i * k.w) / n), span = Math.round((k.w / n) * 0.3);
    let best = ideal;
    for (let x = ideal - span; x <= ideal + span; x++) if (cols[x] < cols[best]) best = x;
    cuts.push(best);
  }
  cuts.push(k.w);
  const frames = cuts.slice(0, -1).map((x0, i) => {
    const x1 = cuts[i + 1], { rows } = hits(k, x0, 0, x1, k.h);
    const top = rows.findIndex(r => r >= MIN), bottom = rows.findLastIndex(r => r >= MIN);
    let sum = 0, count = 0;
    for (let y = Math.round(bottom - (bottom - top) * 0.12); y <= bottom; y++) {
      for (let x = x0; x < x1; x++) {
        if (k.d[(y * k.w + x) * 4 + 3]) {
          sum += x;
          count++;
        }
      }
    }
    return { x0, x1, top, bottom, cx: count ? sum / count : (x0 + x1) / 2 };
  });
  const baseline = Math.max(...frames.map(f => f.bottom)); // feet line; hops stay off the ground
  return frames.map(f => {
    const c = canvas(W, H), ctx = c.getContext('2d'), sw = f.x1 - f.x0, sh = baseline - f.top + 1;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(k.c, f.x0, f.top, sw, sh, W / 2 + (f.x0 - f.cx) * scale, H - sh * scale, sw * scale, sh * scale);
    return harden(c);
  });
}

// units: anything with { sprite, sheet }. Returns Map sprite id -> {
//   frames[view][frame]: canvas   faked poses from the base sheet
//   anims[view][name]: canvas[]   real animation frames, where provided
//   cutins[name]: canvas          2D overlay art, where provided
//   body: { w, h }                the character's size in game px (canvases have headroom above and around it)
// }
export async function loadArt(units) {
  const art = new Map();
  await Promise.all(units.filter(u => u.sheet).map(async u => {
    const { sheet } = u, base = keyed(await loadImage(sheet.file));
    const bases = Object.fromEntries(VIEWS.map(v => [v, cutCell(base, sheet, sheet[v], v === 'side' && sheet.sideFacesLeft)]));
    // every texture of a character shares one canvas, with room for raised weapons, lunges and effects
    const W = Math.round(sheet.h * RES * 2), H = Math.round(sheet.h * RES * 1.5);
    const frames = Object.fromEntries(VIEWS.map(v => [v, Object.fromEntries(FRAMES.map(f => [f, poseCanvas(bases[v], f, v, W, H)]))]));

    // One scale for all of a character's strips: the back idle's standing height maps to sheet.h, and other
    // images scale by their width relative to it (the AI keeps the figure size proportional to image width).
    const anims = {};
    const specs = Object.entries(sheet.anims ?? {}).flatMap(([view, set]) => Object.entries(set).map(([name, [file, n, keep]]) => ({ view, name, file, n, keep })));
    if (specs.length) {
      const ref = specs.find(s => s.view === 'back' && s.name === 'idle') ?? specs[0];
      const strips = await Promise.all(specs.map(async s => ({ ...s, k: keyed(await loadImage(DIR + s.file)) })));
      const refK = strips[specs.indexOf(ref)].k, { rows } = hits(refK, 0, 0, Math.floor(refK.w / ref.n), refK.h);
      const standing = rows.findLastIndex(r => r >= MIN) - rows.findIndex(r => r >= MIN) + 1;
      const scaleAtRef = (sheet.h * RES) / standing;
      for (const s of strips) {
        const frames = stripFrames(s.k, s.n, scaleAtRef * (refK.w / s.k.w), W, H);
        (anims[s.view] ??= {})[s.name] = s.keep ? s.keep.map(i => frames[i]) : frames; // keep: use only some frames
      }
    }

    const cutins = {};
    await Promise.all(Object.entries(sheet.cutins ?? {}).map(async ([name, file]) => {
      cutins[name] = trimmed(keyed(await loadImage(DIR + file)));
    }));

    art.set(u.sprite, { frames, anims, cutins, body: { w: bases.front.width / RES, h: sheet.h } });
  }));
  return art;
}
