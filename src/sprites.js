// Procedural pixel art: shapes on a small grid, then rim-light and outline passes.
// Poses are parameters, so every animation frame comes from the same drawing code.
// A color prefixed with '*' glows (it goes into the emissive map and blooms).
// Attacks play windup -> smear (a motion-blur arc between the two poses) -> strike.
export const FRAMES = ['idle0', 'idle1', 'idle2', 'idle3', 'windup', 'smear', 'strike', 'hurt', 'down', 'victory'];

function grid(w, h) {
  const px = Array.from({ length: h }, () => Array(w).fill(null));
  const filled = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !!px[y][x];
  const set = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (c && x >= 0 && y >= 0 && x < w && y < h) px[y][x] = c;
  };
  return {
    w, h, px, set,
    rect(x, y, rw, rh, c) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) set(x + i, y + j, c);
    },
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) set(x, y, c);
    },
    line(x0, y0, x1, y1, c, thick = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) {
        for (let t = 0; t < thick; t++) set(x0 + ((x1 - x0) * i) / n + t, y0 + ((y1 - y0) * i) / n, c);
      }
    },
    // Rows centered on cx, w0 wide at y0 changing to w1 wide at y1.
    trap(cx, y0, y1, w0, w1, c) {
      for (let y = y0; y <= y1; y++) {
        const hw = (w0 + ((w1 - w0) * (y - y0)) / Math.max(1, y1 - y0)) / 2;
        for (let x = Math.round(cx - hw); x < Math.round(cx + hw); x++) set(x, y, c);
      }
    },
    diamond(x, y, r, c) {
      const tall = Math.round(r * 1.5);
      for (let dy = -tall; dy <= tall; dy++) {
        const hw = Math.round(r * (1 - Math.abs(dy) / tall));
        for (let dx = -hw; dx <= hw; dx++) set(x + dx, y + dy, c);
      }
    },
    mirror() {
      px.forEach(row => row.reverse());
    },
    // Drop everything above row `floor` down by `by` rows (a kneel/crouch); rows from `floor` down stay put.
    sink(by, floor) {
      for (let y = floor - 1; y >= 0; y--) if (y + by < floor) px[y + by] = px[y].slice();
      for (let y = 0; y < by; y++) px[y] = Array(w).fill(null);
    },
    recolor(fn) {
      px.forEach((row, y) => row.forEach((c, x) => {
        const n = c && fn(x, y, c);
        if (n) row[x] = n;
      }));
    },
    // Key light from the upper left: edges facing it get the lighter tone.
    rim(map) {
      const lit = px.map((row, y) => row.map((c, x) => !!c && (!filled(x - 1, y) || !filled(x, y - 1))));
      px.forEach((row, y) => row.forEach((c, x) => { if (lit[y][x] && map[c]) row[x] = map[c]; }));
    },
    outline(c) {
      const edge = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
        if (!px[y][x] && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) edge.push([x, y]);
      for (const [x, y] of edge) px[y][x] = c;
    },
  };
}

// b: body bob in px (down is a crouch), lean: head offset, beat: 0-3 step of the idle cycle (cloth, hair, orbits)
const POSE = {
  idle0: { b: 0, lean: 0, beat: 0 },
  idle1: { b: 1, lean: 0, beat: 1 },
  idle2: { b: 1, lean: 0, beat: 2 },
  idle3: { b: 0, lean: 0, beat: 3 },
  windup: { b: 0, lean: -1, beat: 0 },
  smear: { b: 0, lean: 0, beat: 0 },
  strike: { b: 0, lean: 1, beat: 0 },
  hurt: { b: 1, lean: 2, beat: 0 },
  down: { b: 3, lean: 1, beat: 0 },
  victory: { b: -1, lean: 0, beat: 0 },
};
// Weapon pose lookup: idle frames share 'idle', smear holds the strike pose (plus a swoosh), victory raises the
// weapon like a windup, and down falls back to hurt.
const FALLBACK = { smear: 'strike', victory: 'windup', down: 'hurt' };
const pick = (frame, table) => table[frame] ?? (frame.startsWith('idle') ? table.idle : table[FALLBACK[frame]] ?? table.hurt) ?? table.idle;
// Smear arc from one weapon tip to another, bowed outward, in a glowing near-white.
function swoosh(g, a, b, bow = 6) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const cx = mx + ((b[1] - a[1]) / len) * bow, cy = my - ((b[0] - a[0]) / len) * bow; // control point, perpendicular
  for (let t = 0; t <= 1; t += 0.04) {
    const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
    const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
    g.set(x, y, '*#fff6d8');
    if (t > 0.2 && t < 0.8) g.set(x + 1, y, '*#ffe9a0');
  }
}
const noise = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 97 / 97;

// ---- Heroes: back for the over-the-shoulder camera, front for cut-ins and reverse shots, side in between ----
// The stage picks a view from the camera angle; side sprites face right and are flipped to face left.

export const VIEWS = ['front', 'back', 'side'];
const arm = (g, p, from, to) => g.line(from[0], from[1], to[0], to[1], p.sleeve, 2);

function hero(p, o, frame, view) {
  const g = grid(32, 32);
  const { b, lean, beat } = POSE[frame];
  const front = view === 'front', side = view === 'side';
  const cx = 16, top = 14 + b, sw = (o.broad ? 16 : 12) - (side ? 4 : 0);
  const cloth = [p.cloak, p.cloakShade, p.cloakDeep];

  // Everything is drawn as the back view (weapon on the viewer's right), then mirrored for the front,
  // so the weapon stays in the same hand. Faces, shading and outline go on after the mirror.
  if (side) {
    g.rect(cx - 4, 26, 3, 5, p.boot);
    g.rect(cx + 1, 26, 3, 5, p.boot);
  } else {
    g.rect(cx - 5, 26, 4, 5, p.boot);
    g.rect(cx + 1, 26, 4, 5, p.boot);
  }
  g.trap(cx, top, 27, sw, side ? 11 : 16, p.cloak);
  if (beat) for (let x = cx - 8; x <= cx + 8; x++) if ((x + beat) % 3 === 0) g.set(x, 28, p.cloak); // hem flutters through the idle
  // cloth folds: a couple of darker creases running down the cloak
  for (const fx0 of side ? [cx - 1] : [cx - 4, cx + 2]) g.line(fx0, top + 4, fx0 + (fx0 < cx ? -1 : 1), 25, p.cloakShade);
  if (side) g.set(cx + 3, 30, p.boot); // toe of the leading boot
  g.ellipse(cx + lean * 0.5, top, sw / 2 - 1, 2, p.cloakShade); // collar / hood bunched at the shoulders
  if (!side) {
    arm(g, p, [cx - sw / 2, top + 1], [cx - sw / 2 - 1, top + 8]);
    g.rect(cx - sw / 2 - 1, top + 9, 2, 1, p.skin);
  }

  const hx = cx + lean + (side ? 1 : 0), hy = 8 + b;
  if (!side) {
    g.set(hx - 5, hy + 1, p.skin);
    g.set(hx + 5, hy + 1, p.skin);
  }
  // a hood frames the head from the front and side, and drapes over the shoulders from behind
  if (o.hood && view !== 'back') g.ellipse(hx - (side ? 1 : 0), hy + 1, 5.5, 5.5, p.cloakShade);
  const sway = [0, 1, 0, -1][beat]; // long hair swings with the idle beat
  if (o.hair === 'long' && !front) g.trap(hx - (side ? 2 : 0) + sway / 2, hy + 2, 23 + b, side ? 6 : 9, side ? 5 : 7, p.hair);
  g.ellipse(hx, hy, 4.5, 5, p.hair);
  if (o.hair === 'short') {
    for (let x = hx - 4; x <= hx + 4; x += 2) g.set(x, hy + 5, p.hair);
    g.line(hx - 1, hy - 5, hx - 3, hy - 7, p.hair); // tuft
  }
  if (o.hair === 'spiky') {
    for (const a of [-70, -35, 0, 35, 70]) {
      const r = (a * Math.PI) / 180;
      g.line(hx + Math.sin(r) * 4, hy - Math.cos(r) * 4.5, hx + Math.sin(r) * 6.5, hy - Math.cos(r) * 7, p.hair);
    }
  }
  if (o.hair === 'long' && !front) for (let x = hx - 3; x <= hx + 3; x += 2) g.set(x, 24 + b, p.hair);
  if (o.hood && view === 'back') {
    g.trap(hx, hy + 4, top + 3, 7, 10, p.cloakShade);
    g.set(hx, top + 4, p.cloakShade); // the hood's point
  }
  if (o.ribbon && !front) {
    const rx = side ? hx - 3 : hx; // a bow tied in the hair
    g.rect(rx - 2, hy + 8, 5, 1, p.trim);
    g.set(rx - 2, hy + 7, p.trim);
    g.set(rx + 2, hy + 7, p.trim);
  }

  o.weapon(g, p, frame, { cx, top, sw, b, beat });
  if (front) g.mirror();

  const fx = front ? 31 - hx : hx, bx = front ? 31 - cx : cx; // head and body centers after the mirror
  const closed = frame === 'hurt' || frame === 'down' || frame === 'victory';
  if (front) {
    g.rect(bx - 1, top - 1, 3, 2, p.skin); // neck
    g.line(bx, top + 2, bx, 25, p.cloakDeep); // cloak opening with trim either side
    g.line(bx - 1, top + 2, bx - 1, 25, p.trim);
    g.line(bx + 1, top + 2, bx + 1, 25, p.trim);
    g.ellipse(fx, hy + 1.5, 3.5, 3.2, p.skin);
    g.rect(fx - 4, hy - 2, 9, 1, p.hair); // bangs
    g.rect(fx - 3, hy - 1, 2, 1, p.hair);
    g.rect(fx + 2, hy - 1, 2, 1, p.hair);
    for (const ex of [fx - 2, fx + 1]) {
      g.rect(ex, hy + (closed ? 1 : 0), 2, closed ? 1 : 2, p.eye);
      if (!closed) g.set(ex, hy, '#ffffff'); // catchlight
    }
    g.set(fx - 3, hy + 2, p.blush);
    g.set(fx + 3, hy + 2, p.blush);
    if (frame === 'victory') g.rect(fx - 1, hy + 3, 3, 1, p.mouth); // grin
    else g.set(fx, hy + 3, p.mouth);
    if (o.hair === 'long') {
      g.rect(fx - 5, hy + 1, 2, 9, p.hair);
      g.rect(fx + 4, hy + 1, 2, 9, p.hair);
    }
  } else if (side) {
    g.ellipse(hx + 2, hy + 1.5, 2.5, 3.2, p.skin);
    g.rect(hx - 1, hy - 3, 6, 2, p.hair); // bangs over the brow
    g.rect(hx + 3, hy + (closed ? 1 : 0), 1, closed ? 1 : 2, p.eye);
    if (!closed) g.set(hx + 3, hy, '#ffffff');
    g.set(hx + 5, hy + 2, p.skin); // nose
    g.set(hx + 4, hy + 4, p.skin); // chin
    g.set(hx + 2, hy + 2, p.blush);
  }

  g.recolor((x, y, c) => c === p.cloak && x >= bx + 3 && (x >= bx + 6 ? p.cloakDeep : p.cloakShade));
  g.recolor((x, y, c) => (y === 26 || y === 27 || (o.belt && y === 21 + b)) && cloth.includes(c) && p.trim);
  g.recolor((x, y, c) => c === p.hair && ((x >= fx + 2 && y >= hy - 2) || x >= fx + 3) && p.hairShade);
  g.recolor((x, y, c) => c === p.skin && x >= fx + 2 && y >= hy - 1 && y <= hy + 4 && p.skinShade); // cheek in shadow
  if (view === 'back') {
    // strands so the back of the head doesn't read as a smooth ball
    g.line(hx - 2, hy - 2, hx - 1, hy + 3, p.hairShade);
    g.line(hx + 1, hy - 3, hx + 1, hy + 2, p.hairShade);
  }
  g.rim({ [p.cloak]: p.cloakLight, [p.cloakShade]: p.cloak, [p.hair]: p.hairLight, [p.hairShade]: p.hair });
  g.outline(p.outline);
  return g;
}

function staff(g, p, frame, { cx, top, sw, b }) {
  const [hand, tip, butt] = pick(frame, {
    idle: [[cx + 7, top + 7], [cx + 8, 3 + b], [cx + 8, 30]],
    windup: [[cx + 8, top - 1], [cx + 10, 2], [cx + 7, 25]],
    strike: [[cx + 6, top + 3], [cx + 1, 3], [cx + 12, 23]],
    hurt: [[cx + 8, top + 7], [cx + 9, 4], [cx + 9, 30]],
  });
  arm(g, p, [cx + sw / 2 - 2, top + 1], hand);
  g.line(butt[0], butt[1], tip[0], tip[1], p.wood);
  g.ellipse(tip[0], tip[1], 1.6, 1.6, `*${p.gem}`);
  g.set(hand[0], hand[1], p.skin);
  if (frame === 'smear') swoosh(g, [cx + 10, 2], [cx + 1, 3], 5);
}

function axe(g, p, frame, { cx, top, sw }) {
  const [hand, head, butt] = pick(frame, {
    idle: [[cx + sw / 2 - 1, top + 9], [cx + 8, 5], [cx - 6, 25]], // slung across the back
    windup: [[cx + 4, top - 2], [cx + 2, 3], [cx + 6, 21]],
    strike: [[cx + 6, top + 4], [cx + 12, 27], [cx + 3, top - 1]],
  });
  arm(g, p, [cx + sw / 2 - 2, top + 1], hand);
  g.line(butt[0], butt[1], head[0], head[1], p.wood, 2);
  g.ellipse(head[0], head[1], 3, 3.5, p.steel);
  g.line(head[0] + 2, head[1] - 2, head[0] + 2, head[1] + 2, p.steelLight);
  g.set(hand[0], hand[1], p.skin);
  if (frame === 'smear') swoosh(g, [cx + 2, 3], [cx + 12, 27], 8);
}

function crystal(g, p, frame, { cx, top, sw, beat }) {
  const [hand, gem, r] = pick(frame, {
    // idle: the crystal orbits her hand over the four idle beats
    idle: [[cx + 7, top + 6], [cx + 9 + Math.cos((beat * Math.PI) / 2) * 3, top + 1 + Math.sin((beat * Math.PI) / 2) * 2], 2.5],
    windup: [[cx + 6, top - 4], [cx + 7, 4], 3],
    strike: [[cx + 4, top + 1], [cx + 2, 9], 3.5],
    hurt: [[cx + 8, top + 7], [cx + 12, top + 6], 2.5],
  });
  arm(g, p, [cx + sw / 2 - 2, top + 1], hand);
  g.set(hand[0], hand[1], p.skin);
  // casting splits it into three shards
  const shards = frame === 'strike' || frame === 'smear' ? [[0, 0], [-4, 3], [4, 3]] : [[0, 0]];
  for (const [dx, dy] of shards) {
    g.diamond(gem[0] + dx, gem[1] + dy, dx ? r * 0.6 : r, `*${p.gem}`);
    g.set(gem[0] + dx, gem[1] + dy, '*#ffffff');
  }
}

const LUMEN = {
  outline: '#1a1220', hair: '#e8e1d0', hairShade: '#b9b0a8', hairLight: '#ffffff', skin: '#f2c9a0',
  cloak: '#b8433a', cloakShade: '#8a2f2c', cloakDeep: '#5e1f22', cloakLight: '#e0675a', sleeve: '#8a2f2c',
  trim: '#f5d36b', boot: '#2a1e1a', wood: '#7a5233', gem: '#ff9a3c', eye: '#2a1a3a', mouth: '#a0584a', skinShade: '#d9a982', blush: '#f09a8a',
};
const BRANN = {
  outline: '#141018', hair: '#5a3a22', hairShade: '#3e2716', hairLight: '#7c5434', skin: '#d9a77e',
  cloak: '#3f6e8c', cloakShade: '#2c5068', cloakDeep: '#1d3547', cloakLight: '#5f93b3', sleeve: '#2c5068',
  trim: '#c9cfd6', boot: '#1e1a18', wood: '#5a3d26', steel: '#a9b3bd', steelLight: '#e6edf2', eye: '#1a1a1a', mouth: '#8a4a3a', skinShade: '#b8865e', blush: '#d98a6e',
};
const SELA = {
  outline: '#16132a', hair: '#2b2f5e', hairShade: '#1c1f42', hairLight: '#4a508f', skin: '#f6d8bf',
  cloak: '#e6e2f0', cloakShade: '#b3adc9', cloakDeep: '#8a83a6', cloakLight: '#ffffff', sleeve: '#b3adc9',
  trim: '#7fd8ff', boot: '#2a2640', gem: '#7fd8ff', eye: '#1f3a6a', mouth: '#c27a7a', skinShade: '#e2b9a0', blush: '#f2a0a8',
};

// ---- Enemies: front for the player's camera, plus back and side views ----

function wisp(p, frame, view) {
  const g = grid(32, 32);
  if (frame === 'down') {
    // knocked down: melted into a dazed puddle
    g.ellipse(16, 27, 11, 4, p.body);
    g.ellipse(13, 26, 4, 1.5, p.light);
    if (view !== 'back') for (const x of [12, 19]) { g.line(x, 25, x + 1, 26, p.eye); g.line(x + 1, 25, x, 26, p.eye); }
    g.outline(p.outline);
    return g;
  }
  const { beat } = POSE[frame];
  const sway = beat, up = frame === 'windup' ? 1.5 : 0, wide = frame === 'strike' ? 1 : frame === 'smear' ? 3 : 0;
  const dx = view === 'side' ? 4 : 0; // the face slides toward the facing edge in profile
  for (let i = 0; i < 4; i++) g.ellipse(16 - dx / 2 + Math.sin(i * 1.3 + sway * 2) * 2, 22 + i * 2.2, 6 - i * 1.4, 1.8, p.body);
  for (const [x, y] of [[11, 7], [16, 5], [21, 7]]) g.ellipse(x, y - up + (beat % 2), 1.8, 2.5, p.body); // flickering crown
  g.ellipse(16, 14 - up, 9 + wide, 8.5 + up, p.body);
  g.ellipse(13.5, 10.5 - up, 4.5, 4, p.light);
  arc(g, 16, 15 - up, 5.5, 0.4 + beat * 0.8, 2.2 + beat * 0.8, p.light); // swirl turning inside the body
  if (view !== 'back') {
    const eyes = view === 'side' ? [19 + dx / 2] : [11, 19];
    for (const x of eyes) {
      if (frame === 'hurt') {
        g.line(x, 12, x + 2, 14, p.eye);
        g.line(x + 2, 12, x, 14, p.eye);
      } else {
        const tall = frame === 'windup' ? 1 : 3;
        g.rect(x, 15 - tall, 2, tall, p.eye);
      }
    }
    if (frame === 'strike' || frame === 'smear') g.ellipse(16 + dx, 21, 2.5, 1.5, p.eye);
    g.ellipse(16 + dx / 2, 17.5, 1.6, 1.6, '#ffffff'); // core: the weak point
  }
  g.outline(p.outline);
  return g;
}

function knight(p, frame, view) {
  const g = grid(32, 40);
  const down = frame === 'down', b = down ? 0 : Math.max(0, POSE[frame].b);
  const jolt = frame === 'hurt' ? 1 : down ? 2 : 0, side = view === 'side', back = view === 'back';
  g.rect(11, 28, 4, 10, p.steelDark);
  g.rect(17, 28, 4, 10, p.steelDark);
  g.rect(11, 32, 4, 2, p.steel);
  g.rect(17, 32, 4, 2, p.steel);
  g.rect(10, 37, 5, 2, p.dark);
  g.rect(17, 37, 5, 2, p.dark);
  g.trap(16, 13 + b, 27, side ? 10 : 14, side ? 9 : 12, p.steel);
  g.line(16, 14 + b, 16, 24, p.steelLight); // breastplate ridge
  g.line(11, 20 + b, 21, 20 + b, p.steelDark);
  g.recolor((x, y, c) => c === p.steel && noise(x >> 1, y >> 1) < 0.2 && p.rust); // rust in 2px clumps
  g.recolor((x, y, c) => c === p.steelDark && (x + y) % 3 === 0 && p.dark); // chainmail on the legs
  g.rect(10, 25, 12, 2, p.rustDark);
  if (!side) g.ellipse(9, 14 + b, 4, 3, p.steel);
  g.ellipse(23, 14 + b, 4, 3, p.steel);
  // shield: on the viewer's right from the front, carried across the body in profile
  const sx = side ? 14 : 25;
  g.ellipse(sx, 23, side ? 4 : 5, 7, p.rust);
  g.ellipse(sx, 23, side ? 2 : 3, 5, p.rustDark);
  g.line(sx, 17, sx, 29, p.steelLight);
  const hx = 16 + jolt, hy = 7 + b;
  g.ellipse(hx, hy, 5.5, 6, p.steel);
  g.line(hx, hy - 6, hx, hy - 3, p.rust);
  g.line(hx, hy - 6, hx - 3 - (POSE[frame].beat % 2), hy - 9, '#b8433a', 2); // tattered red plume
  if (!back) {
    // glowing visor slit; only its front half shows in profile
    g.rect(side ? hx : hx - 5, hy, side ? 6 : 11, 2, p.dark);
    if (!side) g.rect(hx - 3, hy, 2, 1, `*${p.eye}`);
    g.rect(hx + 2, hy, 2, 1, `*${p.eye}`);
  }
  // sword: viewer's left from the front, thrust ahead in profile
  const [hilt, tip] = pick(frame, {
    idle: [[6, 22], [6, 38]],
    windup: [[8, 12], [4, 1]],
    strike: [[12, 22], [1, 37]],
  }).map(([x, y]) => [side ? 31 - x : x, y]);
  g.line(side ? 22 : 9, 15 + b, hilt[0], hilt[1], p.steel, 3);
  g.line(hilt[0], hilt[1], tip[0], tip[1], p.steelLight, 2);
  g.rect(hilt[0] - 2, hilt[1], 6, 1, p.dark);
  if (frame === 'smear') swoosh(g, side ? [27, 1] : [4, 1], side ? [30, 37] : [1, 37], side ? 9 : -9);
  if (back) {
    g.mirror();
    g.trap(15, 12 + b, 33, 12, 17, p.rustDark); // tattered cape over the back
    for (let x = 8; x <= 23; x += 3) g.set(x, 34, p.rustDark);
    g.line(15, 14 + b, 15, 30, p.rust);
  }
  if (down) g.sink(7, 36); // drops to one knee, helm tilted, feet planted
  g.rim({ [p.steel]: p.steelLight, [p.rust]: p.rustLight, [p.steelDark]: p.steel, [p.rustDark]: p.rust });
  g.outline(p.outline);
  return g;
}

// Knocked down: rolled onto its side, legs in the air, embers gone dim. Same from every angle.
function houndDown(p) {
  const g = grid(40, 28);
  g.line(8, 21, 2, 24, p.fur, 2);
  for (const x of [12, 16, 24, 28]) g.line(x, 18, x + (x > 20 ? 1 : -1), 12, p.fur, 2);
  g.ellipse(20, 21, 12, 5, p.fur);
  g.line(14, 20, 18, 22, '#7a3a1a');
  g.line(24, 19, 27, 22, '#7a3a1a');
  g.ellipse(33, 22, 5, 4, p.fur);
  g.ellipse(37, 23, 2.5, 1.8, p.furLight);
  g.rect(32, 21, 2, 1, p.dark);
  g.rim({ [p.fur]: p.furLight });
  g.outline(p.outline);
  return g;
}

// Profile hound facing right: long body, four legs, head and snout out front.
function houndSide(p, frame) {
  const g = grid(40, 28);
  const bob = [0, 1, 1, 0][POSE[frame].beat];
  const low = frame === 'windup' ? 2 : frame === 'smear' ? 1 : bob, bite = frame === 'strike' || frame === 'smear';
  g.line(6, 15, 1, 8 + bob, p.fur, 2);
  g.ellipse(17 + (frame === 'smear' ? 2 : 0), 17, frame === 'smear' ? 14 : 12, 6, p.fur); // smear: stretched mid-lunge
  if (frame === 'windup') for (let x = 8; x <= 24; x += 3) g.line(x, 12, x - 1, 9, p.fur);
  for (const x of [7, 11, 22, 26]) g.rect(x, 20, 3, 6, x === 11 || x === 26 ? p.furDark : p.fur);
  for (const x of [7, 11, 22, 26]) g.rect(x - 1, 25, 4, 2, p.furDark);
  g.line(9, 16, 14, 19, `*${p.ember}`);
  g.line(18, 13, 21, 17, `*${p.ember}`);
  g.ellipse(25, 18.5, 1.6, 1.6, `*${p.core}`);
  const hy = 11 + low;
  g.line(27, hy - 6, 28, hy - 2, p.fur, 2);
  g.ellipse(30, hy, 6, 5, p.fur);
  g.ellipse(35, hy + 2, 3.5, 2.2, p.furLight);
  g.set(38, hy + 1, p.dark);
  if (frame === 'hurt') g.rect(31, hy - 1, 2, 1, p.dark);
  else g.rect(31, hy - 1, 2, 1, `*${p.eye}`);
  if (bite) {
    g.rect(33, hy + 4, 5, 1, p.mouth);
    g.set(34, hy + 4, '#f3ead7');
    g.set(37, hy + 4, '#f3ead7');
  }
  g.recolor((x, y, c) => c === p.fur && y >= 20 && p.furDark);
  g.rim({ [p.fur]: p.furLight });
  g.outline(p.outline);
  return g;
}

function hound(p, frame, view) {
  if (frame === 'down') return houndDown(p);
  if (view === 'side') return houndSide(p, frame);
  const g = grid(40, 28);
  const bob = [0, 1, 1, 0][POSE[frame].beat];
  const low = frame === 'windup' ? 2 : frame === 'smear' ? 1 : bob, bite = frame === 'strike' || frame === 'smear', hurt = frame === 'hurt';
  if (view === 'back') {
    g.ellipse(20, 17, 12, 6.5, p.fur);
    g.rect(12, 20, 4, 6, p.fur);
    g.rect(24, 20, 4, 6, p.fur);
    g.rect(11, 25, 6, 2, p.furDark);
    g.rect(23, 25, 6, 2, p.furDark);
    g.line(13, 13, 18, 17, `*${p.ember}`);
    g.line(27, 13, 23, 17, `*${p.ember}`);
    const hy = 9 + low;
    g.line(14, hy - 6, 15, hy - 2, p.fur, 2);
    g.line(25, hy - 6, 24, hy - 2, p.fur, 2);
    g.ellipse(20, hy + 1, 6, 4.5, p.furDark); // back of the head
    g.line(20, 15, 21, 4 + bob, p.fur, 2); // tail up
    g.recolor((x, y, c) => c === p.fur && x >= 27 && p.furDark);
    g.rim({ [p.fur]: p.furLight });
    g.outline(p.outline);
    return g;
  }
  g.line(30, 14, 35, 6 + bob, p.fur, 2);
  g.ellipse(35, 5 + bob, 1.4, 1.4, `*${p.ember}`); // ember at the tail tip
  g.ellipse(20, 17, frame === 'smear' ? 14 : 12, 6.5, p.fur);
  g.recolor((x, y, c) => c === p.fur && noise(x, y >> 1) < 0.12 && p.furLight); // fur streaks
  if (frame === 'windup') for (let x = 11; x <= 29; x += 3) g.line(x, 12, x + 1, 9, p.fur);
  g.rect(12, 20, 4, 6, p.fur);
  g.rect(24, 20, 4, 6, p.fur);
  g.rect(11, 25, 6, 2, p.furDark);
  g.rect(23, 25, 6, 2, p.furDark);
  g.recolor((x, y, c) => c === p.fur && x >= 27 && p.furDark);
  g.line(13, 15, 17, 19, `*${p.ember}`);
  g.line(27, 14, 24, 18, `*${p.ember}`);
  g.line(14, 21, 14, 24, `*${p.ember}`);
  g.line(26, 21, 26, 23, `*${p.ember}`);
  g.ellipse(20, 19.5, 1.6, 1.6, `*${p.core}`); // core: the weak point
  const hy = 9 + low;
  g.line(14, hy - 6, 15, hy - 2, p.fur, 2);
  g.line(25, hy - 6, 24, hy - 2, p.fur, 2);
  g.ellipse(20, hy, 7 + (bite ? 1 : 0), 5.5, p.fur);
  g.ellipse(20, hy + 4, 3.5, 2.5, p.furLight);
  g.rect(19, hy + 3, 2, 1, p.dark);
  if (hurt) {
    g.rect(16, hy - 1, 3, 1, p.dark);
    g.rect(22, hy - 1, 3, 1, p.dark);
  } else {
    g.rect(16, hy - 1, 2, 2, `*${p.eye}`);
    g.rect(23, hy - 1, 2, 2, `*${p.eye}`);
  }
  if (!hurt && !bite) {
    g.set(18, hy + 5, '#f3ead7'); // fangs peeking out
    g.set(22, hy + 5, '#f3ead7');
  }
  if (bite) {
    g.rect(17, hy + 6, 6, 2, p.mouth);
    g.set(17, hy + 6, '#f3ead7');
    g.set(22, hy + 6, '#f3ead7');
  }
  g.rim({ [p.fur]: p.furLight });
  g.outline(p.outline);
  return g;
}

const ART = {
  lumen: (f, v) => hero(LUMEN, { hair: 'short', weapon: staff, hood: true }, f, v),
  brann: (f, v) => hero(BRANN, { hair: 'spiky', weapon: axe, broad: true, belt: true }, f, v),
  sela: (f, v) => hero(SELA, { hair: 'long', weapon: crystal, ribbon: true }, f, v),
  wisp: (f, v) => wisp({ body: '#3fbf9a', light: '#9fffd9', eye: '#0b2a22', outline: '#1f6e5a' }, f, v),
  knight: (f, v) => knight({
    steel: '#7b7f8c', steelLight: '#b5bac6', steelDark: '#4e515c', rust: '#9a4e2a', rustDark: '#6a3220',
    rustLight: '#c06a3a', dark: '#1c1a20', eye: '#ff4a2c', outline: '#120f14',
  }, f, v),
  hound: (f, v) => hound({
    fur: '#3a3234', furDark: '#262022', furLight: '#5a4e50', ember: '#ff7a2c', core: '#ffd27a',
    eye: '#ffe14d', dark: '#120d0e', mouth: '#6a1a1a', outline: '#0d0a0b',
  }, f, v),
};

// Returns { w, h, px } where px[y][x] is null, '#rrggbb' or '*#rrggbb' (glowing).
export const drawSprite = (id, frame, view = 'front') => ART[id](frame, view);

// ---- Spell effects: short flipbooks played at the target; the stage renders every pixel glowing ----

export const FX_FRAMES = 6;
const rand = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const arc = (g, cx, cy, r, a0, a1, c) => {
  for (let a = a0; a <= a1; a += 0.06) g.set(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
};

const EFFECTS = {
  // Flame tongues rise and fall, then embers drift up.
  fire(f) {
    const g = grid(32, 32), life = Math.sin((Math.PI * (f + 1)) / (FX_FRAMES + 1)), r = rand(11 + f);
    for (let k = 0; k < 5; k++) {
      const x = 8 + k * 4 + Math.round(r() * 2 - 1), h = (12 + r() * 16) * life, lean = r() * 4 - 2;
      // a tongue = round base plus a tip that leans, layered hot-to-cool from the inside out
      g.ellipse(x, 29, 3.5, 2.5, '#ff5a1f');
      g.line(x, 29, x + lean, 31 - h, '#ff5a1f', 2);
      g.trap(x + lean / 2, 31 - h * 0.6, 29, 1, 5, '#ff5a1f');
      g.trap(x + lean / 3, 31 - h * 0.45, 30, 1, 3, '#ffb347');
      g.trap(x, 31 - h * 0.25, 30, 1, 2, '#fff3b0');
    }
    for (let i = 0; i < 6; i++) g.set(6 + r() * 20, 26 - f * 4 - r() * 6, r() < 0.5 ? '#ffb347' : '#ff5a1f');
    return g;
  },
  // Shards grow out of the ground, then shatter outward under gravity.
  ice(f) {
    const g = grid(32, 32), r = rand(23);
    if (f < 3) {
      const grow = (f + 1) / 3;
      for (const [x, h] of [[16, 26], [9, 18], [23, 18], [3, 11], [29, 11]]) {
        const hh = h * grow;
        g.diamond(x, 31 - hh / 2, hh / 5, '#5fc8ff');
        g.diamond(x, 31 - hh / 2, hh / 10, '#bff0ff');
        g.set(x, 31 - hh / 2, '#ffffff');
      }
    } else {
      const k = f - 1;
      for (let i = 0; i < 20; i++) {
        const a = Math.PI + r() * Math.PI, sp = 2 + r() * 3, s = k < 3 ? 2 : 1;
        g.rect(16 + Math.cos(a) * sp * k, 22 + Math.sin(a) * sp * k + k * k * 0.9, s, s, i % 3 ? '#bff0ff' : '#ffffff');
      }
    }
    return g;
  },
  // A jagged bolt from the sky that re-forks every frame, then a spark ring on impact.
  elec(f) {
    const g = grid(32, 48), r = rand(5 + f * 7);
    if (f < 4) {
      let x = 12 + r() * 8, y = 0;
      while (y < 46) {
        const ny = Math.min(46, y + 4 + r() * 4);
        const nx = ny >= 46 ? 16 : Math.max(4, Math.min(27, x + r() * 10 - 5));
        g.line(x - 1, y, nx - 1, ny, '#ffe66b', 3);
        if (r() < 0.3) g.line(nx, ny, nx + r() * 12 - 6, ny + 6, '#ffe66b');
        g.line(x, y, nx, ny, '#ffffff');
        x = nx;
        y = ny;
      }
    }
    const k = f < 3 ? 1 : f - 1;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.set(16 + Math.cos(a) * 4 * k, 45 + Math.sin(a) * 1.5 * k, i % 2 ? '#ffffff' : '#ffe66b');
    }
    return g;
  },
  // Crescent gusts spin outward around the target.
  wind(f) {
    const g = grid(32, 32), spin = f * 0.9;
    for (let i = 0; i < 3; i++) {
      const a0 = spin + (i * Math.PI * 2) / 3, rad = 5 + i * 3 + f * 1.2;
      arc(g, 16, 16, rad, a0, a0 + 1.8, '#7dffb0');
      if (f < 5) arc(g, 16, 16, rad + 1, a0 + 0.3, a0 + 1.5, '#d6ffe9');
    }
    return g;
  },
  // All-Out Attack: a cartoon fight cloud with limbs, weapons and stars poking out of it.
  brawl(f) {
    const g = grid(48, 40), r = rand(31 + f * 13), ink = '#2a2236', puff = '#e9e4f0';
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * r(), len = 20 + r() * 6; // upper half only, so limbs never poke into the floor
      g.line(24, 26, 24 + Math.cos(a) * len, 26 + Math.sin(a) * len * 0.9, ink, 2);
      g.ellipse(24 + Math.cos(a) * len, 26 + Math.sin(a) * len * 0.9, 1.5, 1.5, ink); // fist / boot
    }
    for (let i = 0; i < 9; i++) g.ellipse(12 + r() * 24, 20 + r() * 12, 5 + r() * 3, 4 + r() * 2, puff);
    g.recolor((x, y, c) => c === puff && y > 31 && '#b9b3c9');
    for (let i = 0; i < 3; i++) {
      const x = 6 + r() * 36, y = 4 + r() * 28;
      g.line(x - 2, y, x + 2, y, '#ffe66b');
      g.line(x, y - 2, x, y + 2, '#ffe66b');
      g.set(x, y, '#ffffff');
    }
    g.outline(ink);
    return g;
  },
  // Knocked-down status: three stars circling above the head; the far side of the orbit is dimmer.
  dizzy(f) {
    const g = grid(24, 10);
    for (let k = 0; k < 3; k++) {
      const a = (f / FX_FRAMES) * Math.PI * 2 + (k * Math.PI * 2) / 3, x = 12 + Math.cos(a) * 9, y = 5 + Math.sin(a) * 3;
      const c = Math.sin(a) > 0 ? '#ffe66b' : '#a8913a';
      g.line(x - 1, y, x + 1, y, c);
      g.line(x, y - 1, x, y + 1, c);
    }
    return g;
  },
  // Spell circle under a caster: rings with rotating glyph ticks, drawn white so the stage can tint it per element.
  rune(f) {
    const g = grid(32, 32), grow = Math.min(1, (f + 1) / 3), spin = f * 0.35;
    arc(g, 16, 16, 14 * grow, 0, Math.PI * 2, '#ffffff');
    arc(g, 16, 16, 10 * grow, 0, Math.PI * 2, '#ffffff');
    for (let k = 0; k < 8; k++) {
      const a = spin + (k * Math.PI) / 4;
      g.line(16 + Math.cos(a) * 10 * grow, 16 + Math.sin(a) * 10 * grow, 16 + Math.cos(a) * 14 * grow, 16 + Math.sin(a) * 14 * grow, '#ffffff');
      g.set(16 + Math.cos(a + 0.4) * 12 * grow, 16 + Math.sin(a + 0.4) * 12 * grow, '#ffffff');
    }
    return g;
  },
  // Dust kicked up at the feet when someone dashes or lands a heavy step.
  dust(f) {
    const g = grid(24, 12), r = rand(41);
    for (let i = 0; i < 5 - Math.floor(f / 2); i++) g.ellipse(12 + (r() - 0.5) * (6 + f * 3), 9 - r() * f, 2 + f * 0.5, 1.5 + f * 0.3, i % 2 ? '#c9bfb0' : '#9a8f84');
    return g;
  },
  // Floor crack for heavy slams, spreading out from the impact.
  crack(f) {
    const g = grid(32, 32), r = rand(77), len = 4 + f * 2.2;
    for (let k = 0; k < 6; k++) {
      let x = 16, y = 16, a = (k * Math.PI) / 3 + r();
      for (let s = 0; s < len; s += 2) {
        const nx = x + Math.cos(a) * 2, ny = y + Math.sin(a) * 2;
        g.line(x, y, nx, ny, '#141012');
        x = nx;
        y = ny;
        a += r() - 0.5;
      }
    }
    g.ellipse(16, 16, 2, 2, '#141012');
    return g;
  },
  // The lantern handed over in a baton pass: ring handle, cap, glowing glass, base.
  lantern() {
    const g = grid(14, 20);
    arc(g, 7, 4, 3, Math.PI, Math.PI * 2, '#3a2a20');
    g.rect(3, 4, 8, 2, '#5a3d26');
    g.rect(4, 6, 6, 9, '#ffb347');
    g.rect(5, 7, 4, 7, '#fff3b0');
    g.line(7, 6, 7, 14, '#ff9a3c');
    g.rect(3, 15, 8, 2, '#5a3d26');
    g.rect(5, 17, 4, 1, '#3a2a20');
    g.outline('#1a1220');
    return g;
  },
  // Frost ring that sits under Sela's feet.
  frost() {
    const g = grid(32, 32), r = rand(9);
    arc(g, 16, 16, 13, 0, Math.PI * 2, '#bff0ff');
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = 6 + r() * 8;
      g.set(16 + Math.cos(a) * d, 16 + Math.sin(a) * d, r() < 0.3 ? '#ffffff' : '#7fd8ff');
    }
    return g;
  },
  // Impact star with a slash streak.
  phys(f) {
    const g = grid(32, 32), len = [4, 9, 12, 12, 9, 5][f];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2, l = i % 2 ? len * 0.6 : len, inner = f > 2 ? l - 4 : 1;
      g.line(16 + Math.cos(a) * inner, 16 + Math.sin(a) * inner, 16 + Math.cos(a) * l, 16 + Math.sin(a) * l, i % 2 ? '#fff3c4' : '#ffffff');
    }
    if (f < 3) g.line(6, 26, 26, 6, '#ffffff', 2);
    if (f < 2) g.ellipse(16, 16, 3, 3, '#ffffff');
    return g;
  },
};

export const drawEffect = (element, frame) => (EFFECTS[element] ?? EFFECTS.phys)(frame);
