import { createBattle, applyAction, current, unit, alive, canAllOut, batonTargets, enemyIntent, MAX_AP } from './battle.js';
import { party, enemies, ELEMENT_COLOR } from './data.js';
import { createStage } from './stage.js';
import { drawSprite, drawEffect } from './sprites.js';
import { startAudio, sfx, toggleMute, fadeMusic } from './audio.js';
import { loadArt, RES } from './sheets.js';

const $ = sel => document.querySelector(sel);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const el = (tag, cls = '', text = '') => Object.assign(document.createElement(tag), { className: cls, textContent: text });
const img = src => Object.assign(new Image(), { src, alt: '' });
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Show an overlay and restart its CSS animation.
const replay = node => {
  node.classList.remove('play');
  node.hidden = false;
  void node.offsetWidth;
  node.classList.add('play');
};

let state = createBattle(party, enemies);
const art = await loadArt(state.units); // hand-made sprite sheets, where a character has one
const stage = createStage($('#scene'), state.units, art);
const known = new Map(); // enemy id -> affinities discovered by hitting them, Persona-style
const stats = { turns: 0, weak: 0, parries: 0, streak: 0, best: 0 };

$('#mute').onclick = e => {
  const muted = toggleMute();
  e.currentTarget.setAttribute('aria-pressed', String(muted));
  e.currentTarget.textContent = muted ? 'Sound off' : 'Sound on';
};

function renderHud() {
  const now = current(state).id;
  $('#party').replaceChildren(...state.units.filter(u => u.side === 'party').map(u => {
    const card = el('div', `card${u.id === now ? ' active' : ''}${u.hp === 0 ? ' ko' : ''}${u.boost ? ' boosted' : ''}`);
    const bar = el('div', 'bar');
    const fill = el('i');
    fill.style.transform = `scaleX(${u.hp / u.maxHp})`;
    bar.append(fill);
    const pips = el('div', 'ap');
    pips.setAttribute('role', 'img');
    pips.setAttribute('aria-label', `AP ${u.ap} of ${MAX_AP}`);
    for (let i = 0; i < MAX_AP; i++) pips.append(el('b', i < u.ap ? 'on' : ''));
    const face = img(portrait(u.sprite));
    face.className = 'face';
    const info = el('div', 'info');
    info.append(el('div', 'name', u.name + (u.down ? ' · DOWN' : '')), bar, el('div', 'hp', `HP ${u.hp}/${u.maxHp}`), pips);
    card.append(face, info);
    return card;
  }));
}

async function banner(text, cls = '') {
  const b = $('#banner');
  b.textContent = text;
  b.className = cls;
  void b.offsetWidth; // restart the CSS animation
  b.classList.add('show');
  await sleep(cls === 'big' ? 900 : 600);
}

function pop(id, text, cls = '') {
  const { x, y } = stage.screenPos(id);
  const p = el('div', `pop ${cls}`, text);
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  $('#fx').append(p);
  setTimeout(() => p.remove(), 1000);
}

function menu(items) {
  return new Promise(resolve => {
    const m = $('#menu');
    m.replaceChildren(...items.map(it => {
      const b = el('button', it.cls);
      b.disabled = !!it.disabled;
      b.append(el('span', '', it.label), el('small', '', it.sub ?? ''));
      b.onclick = () => { sfx.confirm(); m.hidden = true; resolve(it.value); };
      return b;
    }));
    m.hidden = false;
    m.querySelector('button:not(:disabled)')?.focus();
  });
}

const affinities = u => [...(known.get(u.id) ?? [])].join(' · ') || 'affinity ???';

// Floating labels over each candidate (enemies by default, teammates for a baton pass).
function pickTarget(list = alive(state, 'enemy'), sub = affinities) {
  return new Promise(resolve => {
    const layer = $('#targets');
    let raf;
    const done = v => {
      (v ? sfx.confirm : sfx.cancel)();
      cancelAnimationFrame(raf);
      layer.hidden = true;
      removeEventListener('keydown', esc);
      resolve(v);
    };
    const esc = e => e.key === 'Escape' && done(null);
    addEventListener('keydown', esc);
    const buttons = list.map(u => {
      const b = el('button', 'target');
      b.append(el('span', '', u.name), el('small', '', sub(u)));
      b.onclick = () => done(u.id);
      return b;
    });
    // Labels track their unit while the idle camera moves.
    const place = () => {
      list.forEach((u, i) => {
        const { x, y } = stage.screenPos(u.id, 1.1);
        buttons[i].style.left = `${x}px`;
        buttons[i].style.top = `${y}px`;
      });
      raf = requestAnimationFrame(place);
    };
    place();
    const back = el('button', 'back', 'Back (Esc)');
    back.onclick = () => done(null);
    layer.replaceChildren(...buttons, back);
    layer.hidden = false;
    buttons[0]?.focus();
  });
}

// Command menu sits beside the active hero, on the side facing the enemies, and follows the idle camera.
function followMenu(actor) {
  const m = $('#menu');
  let raf;
  const tick = () => {
    const { x, y } = stage.screenPos(actor.id, 0.5), gap = innerWidth * 0.12, left = x < innerWidth / 2;
    m.style.left = left ? `${x + gap}px` : 'auto';
    m.style.right = left ? 'auto' : `${innerWidth - x + gap}px`;
    m.style.bottom = `${Math.min(innerHeight * 0.6, Math.max(16, innerHeight - y))}px`;
    raf = requestAnimationFrame(tick);
  };
  tick();
  return () => cancelAnimationFrame(raf);
}

async function chooseAction(actor) {
  const stop = followMenu(actor);
  try {
    return await pickAction(actor);
  } finally {
    stop();
    stage.hold();
  }
}

async function pickAction(actor) {
  for (;;) {
    const allies = batonTargets(state);
    const pick = await menu([
      { label: 'Attack', sub: '+1 AP', value: { type: 'attack' } },
      { label: 'Free Aim', sub: `1 AP · ${actor.shots} left`, value: { type: 'shot' }, disabled: actor.shots < 1 || actor.ap < 1 },
      ...actor.skills.map(k => ({ label: k.name, sub: `${k.element} · ${k.ap} AP`, value: { type: 'skill', skill: k.id }, disabled: actor.ap < k.ap })),
      ...(allies.length ? [{ label: 'Baton Pass', sub: 'hand off this turn', value: { type: 'baton' }, cls: 'baton' }] : []),
      ...(canAllOut(state) ? [{ label: 'All-Out Attack!', sub: 'all foes down', value: { type: 'allOut' }, cls: 'hot' }] : []),
    ]);
    if (pick.type === 'allOut') return { ...pick, actor: actor.id };
    if (pick.type === 'baton') {
      const to = await pickTarget(allies, () => `+${25 * (state.chain.length + 1)}% damage`);
      if (to) return { ...pick, actor: actor.id, target: to };
      continue;
    }
    if (pick.type === 'shot') {
      stage.steady(); // hold the standard shot so weak points don't move under the reticle
      const shot = await aim();
      if (shot) return { ...pick, actor: actor.id, ...shot };
      continue;
    }
    const target = await pickTarget();
    if (target) return { ...pick, actor: actor.id, target };
  }
}

// Expedition 33-style free aim: mouse/touch or arrow keys move the reticle, click/Enter fires.
function aim() {
  const WP_RADIUS = 14; // px, matches the .wp marker
  const foes = alive(state, 'enemy');
  const weakSpot = u => {
    const b = stage.screenBox(u.id);
    return { x: b.x + u.weakPoint.x * b.halfW, y: b.bottom - u.weakPoint.y * (b.bottom - b.top) };
  };
  const judge = (x, y) => {
    for (const u of foes) {
      const p = weakSpot(u);
      if (Math.hypot(x - p.x, y - p.y) <= WP_RADIUS) return { target: u.id, hit: 'weakPoint' };
    }
    for (const u of foes) {
      const b = stage.screenBox(u.id);
      if (Math.abs(x - b.x) <= b.halfW && y >= b.top && y <= b.bottom) return { target: u.id, hit: 'body' };
    }
    return { hit: 'miss' };
  };
  return new Promise(resolve => {
    const layer = $('#aim'), reticle = layer.querySelector('.reticle');
    const marks = foes.map(() => el('div', 'wp'));
    layer.querySelector('.marks').replaceChildren(...marks);
    let x = innerWidth / 2, y = innerHeight / 2, raf;
    const finish = result => {
      (result ? sfx.shot : sfx.cancel)();
      cancelAnimationFrame(raf);
      layer.hidden = true;
      removeEventListener('keydown', key);
      layer.onpointermove = layer.onpointerdown = null;
      resolve(result);
    };
    const key = e => {
      if (e.key === 'Escape') return finish(null);
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        return finish(judge(x, y));
      }
      const step = e.shiftKey ? 3 : 14;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (d) {
        e.preventDefault();
        x += d[0];
        y += d[1];
      }
    };
    addEventListener('keydown', key);
    layer.onpointermove = e => { x = e.clientX; y = e.clientY; };
    layer.onpointerdown = e => finish(judge(e.clientX, e.clientY));
    const tick = () => {
      foes.forEach((u, i) => {
        const p = weakSpot(u);
        marks[i].style.translate = `${p.x}px ${p.y}px`;
      });
      reticle.style.translate = `${x}px ${y}px`;
      raf = requestAnimationFrame(tick);
    };
    layer.hidden = false;
    tick();
  });
}

// Expedition 33-style defense, one ring per hit of the enemy's combo. Space parries (tight window, and a fully
// parried combo earns a counter); D dodges (looser window). On touch, the on-screen buttons do the same.
// A press locks in the result, but it only resolves when the hit lands, so a combo keeps its rhythm.
const DASH = 250, PERFECT = 90, DODGE = 200;
function parryPrompt(targetId, impact, element) {
  return new Promise(resolve => {
    const box = $('#parry'), ring = box.querySelector('.ring'), goal = box.querySelector('.goal');
    const acts = box.querySelectorAll('[data-act]');
    const { x, y } = stage.screenPos(targetId, 0.55);
    for (const n of [ring, goal]) { n.style.left = `${x}px`; n.style.top = `${y}px`; }
    ring.classList.remove('locked');
    box.hidden = false;
    const t0 = performance.now();
    let raf, locked = null;
    const finish = result => {
      cancelAnimationFrame(raf);
      removeEventListener('keydown', key);
      acts.forEach(b => (b.onpointerdown = null));
      box.hidden = true;
      if (result === 'perfect') {
        stage.hitStop(90);
        stage.parry(targetId);
        sfx.parry();
        stage.effect(targetId, 'phys');
        stage.shake(0.12);
        pop(targetId, 'PARRY!', 'tag');
      } else if (result === 'dodge') {
        sfx.dodge();
        stage.dodge(targetId);
        pop(targetId, 'DODGE', 'tag');
      } else {
        stage.hitStop(60);
        sfx.hit();
        stage.effect(targetId, element);
        stage.flash(targetId, ELEMENT_COLOR[element] ?? '#ffffff');
        stage.shake(0.2);
      }
      resolve(result);
    };
    const judge = act => {
      if (locked) return;
      const d = Math.abs(performance.now() - t0 - impact);
      locked = act === 'parry' ? (d <= PERFECT ? 'perfect' : 'none') : d <= DODGE ? 'dodge' : 'none';
      ring.classList.add('locked');
    };
    const key = e => {
      const act = e.code === 'Space' ? 'parry' : e.code === 'KeyD' ? 'dodge' : null;
      if (!act || e.repeat) return;
      e.preventDefault();
      judge(act);
    };
    addEventListener('keydown', key);
    acts.forEach(b => (b.onpointerdown = e => {
      e.preventDefault();
      judge(b.dataset.act);
    }));
    const tick = () => {
      const t = performance.now() - t0;
      // resolve at the moment of impact if locked in, or once the dodge window has closed
      if ((locked && t >= impact) || t > impact + DODGE) return finish(locked ?? 'none');
      ring.style.transform = `translate(-50%, -50%) scale(${Math.max(1, 1 + 2.5 * (1 - t / impact))})`;
      ring.classList.toggle('now', Math.abs(t - impact) <= PERFECT);
      raf = requestAnimationFrame(tick);
    };
    tick();
  });
}

async function enemyTurn(actor) {
  const intent = enemyIntent(state);
  const move = actor.skills.find(k => k.id === intent.skill) ?? actor.attack;
  // Watch it come at you: camera over the shoulder of the hero being attacked.
  await stage.focus(intent.target);
  stage.hold();
  if (move.element !== 'phys') stage.effect(actor.id, move.element); // the skill's element flares on it as a tell
  await banner(`${actor.name}: ${move.name ?? 'Attack'} → ${unit(state, intent.target).name}`);
  const parries = [];
  for (const [i, ms] of (actor.combo ?? [1100]).entries()) {
    // the first hit dashes in and lands on the beat; follow-ups strike from where it stands
    const swing = i === 0 ? stage.strike(actor.id, intent.target, ms - DASH, DASH) : stage.jab(actor.id, ms);
    parries.push(await parryPrompt(intent.target, ms, move.element));
    await swing;
  }
  return { ...intent, parries };
}

function learn(e) {
  if (!e.weak && !e.resist) return;
  const set = known.get(e.target) ?? new Set();
  set.add(`${e.weak ? 'weak' : 'resists'} ${e.element}`);
  known.set(e.target, set);
}

async function play({ state: next, events }, action) {
  // Enemy combos already played each hit live during the parry prompts; here they only add damage numbers.
  const defended = action.type === 'enemyAttack';
  const skill = action.type === 'skill' ? unit(state, action.actor).skills.find(k => k.id === action.skill) : null;
  let out = defended ? action.actor : null; // actor currently stepped forward
  const stepTo = async (id, target) => {
    if (out === id) return;
    if (out) await stage.retreat(out);
    // ranged skills cast from where the hero stands; attacks and melee skills close the distance
    if (skill && !skill.melee && id === action.actor) {
      await stage.cast(id, target, ELEMENT_COLOR[skill.element]);
    } else {
      if (skill && skill.element !== 'phys' && id === action.actor) stage.effect(id, skill.element); // e.g. wind around Brann's axe
      await stage.strike(id, target);
    }
    out = id;
  };
  let allOut = false;
  for (const e of events) {
    switch (e.type) {
      case 'hit': {
        const live = !(defended && e.actor === action.actor);
        if (live && !allOut && action.type !== 'shot') await stepTo(e.actor, e.target);
        if (live) {
          stage.hitStop(e.weak ? 110 : 60);
          if (skill?.fx && e.actor === action.actor) stage.ground(e.target, skill.fx);
          stage.effect(e.target, e.element ?? 'phys');
          stage.flash(e.target, ELEMENT_COLOR[e.element] ?? '#ffffff');
          sfx[e.element]?.();
          (e.weak ? sfx.weak : e.resist ? sfx.resist : sfx.hit)();
          stage.shake(e.weak ? 0.25 : 0.1);
        }
        pop(e.target, String(e.dmg), e.weak ? 'weak' : e.resist ? 'resist' : '');
        if (e.weak && unit(state, e.actor).side === 'party') stats.weak++;
        learn(e);
        await sleep(live ? 280 : 160);
        break;
      }
      case 'miss':
        sfx.miss();
        pop(e.actor, 'MISS', 'tag');
        await sleep(400);
        break;
      case 'counter':
        sfx.parry();
        pop(e.actor, 'COUNTER!', 'tag');
        await sleep(250);
        break;
      case 'down':
        stage.setDown(e.target, true);
        sfx.down();
        pop(e.target, 'WEAK · DOWN', 'tag');
        break;
      case 'standUp':
        stage.setDown(e.target, false);
        break;
      case 'ko':
        stage.ko(e.target);
        sfx.ko();
        break;
      case 'oneMore':
        sfx.oneMore();
        await banner('ONE MORE!', 'big');
        break;
      case 'baton':
        await batonPass(unit(state, e.actor), unit(next, e.target));
        break;
      case 'allOut': {
        allOut = true;
        const crew = alive(state, 'party');
        await stage.focus(null);
        await banner('ALL-OUT ATTACK!', 'big');
        await stage.brawl(crew.map(u => u.id), alive(state, 'enemy').map(u => u.id), sfx.brawl);
        await rush(crew);
        await finisher(unit(state, e.actor), crew);
        break;
      }
    }
  }
  if (out) await stage.retreat(out);
  state = next;
  for (const u of state.units) if (u.side === 'party') stage.setBoost(u.id, u.boost > 0);
}

// Renders a pixel grid, or a rectangle cropped out of it, to an image URL for the 2D cut-ins.
const gridURL = (g, x0 = 0, y0 = 0, w = g.w, h = g.h) => {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h }), ctx = c.getContext('2d');
  g.px.forEach((row, y) => row.forEach((col, x) => {
    if (!col) return;
    ctx.fillStyle = col.replace('*', '');
    ctx.fillRect(x - x0, y - y0, 1, 1);
  }));
  return c.toDataURL();
};
const spriteURL = (id, frame, view = 'front') => art.get(id)?.frames[view][frame].toDataURL() ?? gridURL(drawSprite(id, frame, view));
// Crop a fraction of a canvas (x, y, w, h all 0-1) to an image URL.
const cropURL = (c, fx, fy, fw, fh) => {
  const w = Math.round(c.width * fw), h = Math.round(c.height * fh), out = Object.assign(document.createElement('canvas'), { width: w, height: h });
  out.getContext('2d').drawImage(c, c.width * fx, c.height * fy, w, h, 0, 0, w, h);
  return out.toDataURL();
};

// Head-and-shoulders crop of the front view, for HUD cards and name cards.
// Crop of a sheet character's front idle in fractions of its body (its canvas has headroom around the body).
const bodyCropURL = (entry, fx, fy, fw, fh) => {
  const c = entry.frames.front.idle0, bw = entry.body.w * RES, bh = entry.body.h * RES;
  const x0 = (c.width - bw) / 2, y0 = c.height - bh;
  return cropURL(c, (x0 + bw * fx) / c.width, (y0 + bh * fy) / c.height, (bw * fw) / c.width, (bh * fh) / c.height);
};
// Dedicated cut-in art from the character's sheet, if it has that piece.
const cutin = (id, name) => art.get(id)?.cutins[name]?.toDataURL();

const portrait = id => {
  if (art.has(id)) return cutin(id, 'portrait') ?? bodyCropURL(art.get(id), -0.1, 0, 1.2, 0.55);
  const g = drawSprite(id, 'idle0', 'front');
  return gridURL(g, 0, 0, g.w, Math.round(g.h * 0.62));
};
// Tight band across a hero's eyes, for the All-Out eye cut-ins.
const eyeBand = id => (art.has(id)
  ? cutin(id, 'eyes') ?? bodyCropURL(art.get(id), 0.15, 0.14, 0.7, 0.26)
  : gridURL(drawSprite(id, 'idle0', 'front'), 8, 4, 16, 9));

// Baton pass cut-in: a comic page split down a diagonal seam, each panel in its hero's color. The giver hurls a
// glowing lantern across the seam; the receiver catches it and their panel blazes with rays.
async function batonPass(from, to) {
  const box = $('#baton');
  box.style.setProperty('--a', from.color);
  box.style.setProperty('--b', to.color);
  box.querySelector('.giver .who').replaceChildren(img(cutin(from.sprite, 'batonThrow') ?? spriteURL(from.sprite, 'strike')));
  const catchArt = cutin(to.sprite, 'batonCatch');
  box.querySelector('.taker .who').replaceChildren(img(catchArt ?? spriteURL(to.sprite, 'victory')));
  box.querySelector('.taker .who').classList.toggle('flip', !!catchArt); // catch art is drawn facing right; turn it toward the giver
  box.querySelector('.lantern').replaceChildren(img(gridURL(drawEffect('lantern'))));
  box.querySelector('strong').textContent = `${from.name} → ${to.name}`;
  box.querySelector('em').textContent = `+${25 * to.boost}% power`;
  replay(box);
  setTimeout(sfx.dodge, 350); // the throw
  setTimeout(sfx.baton, 950); // the catch
  await sleep(1700);
  box.hidden = true;
  stage.flash(to.id, '#ffe66b');
}

// All-Out, middle act. Eye cut-ins: a strip per hero slams across the screen showing just their eyes. Then the
// screen drains to ink and three giant brush strokes in the heroes' colors are painted across the enemies.
async function rush(crew) {
  const box = $('#rush');
  box.style.setProperty('--n', crew.length);
  const strips = crew.map((h, i) => {
    const strip = el('div', 'strip');
    strip.style.setProperty('--c', h.color);
    strip.style.setProperty('--i', i);
    strip.style.setProperty('--from', i % 2 ? '100vw' : '-100vw');
    strip.append(img(eyeBand(h.sprite)));
    return strip;
  });
  const PATHS = ['M-5 72 Q 40 42 105 22', 'M105 82 Q 52 52 -5 30', 'M14 106 Q 46 50 88 -6'];
  const svg = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">${crew.map((h, i) => `
      <path d="${PATHS[i % PATHS.length]}" stroke="#000" stroke-width="9" style="--i:${i}"/>
      <path d="${PATHS[i % PATHS.length]}" stroke="${h.color}" stroke-width="6.5" style="--i:${i}"/>
      <path d="${PATHS[i % PATHS.length]}" stroke="#fff" stroke-width="1.6" style="--i:${i}"/>`).join('')}</svg>`,
    'image/svg+xml',
  ).documentElement;
  box.replaceChildren(el('div', 'ink'), ...strips, svg, el('div', 'flash'));
  replay(box);
  crew.forEach((_, i) => setTimeout(sfx.brawl, i * 180)); // strips slam in
  crew.forEach((_, i) => setTimeout(() => {
    sfx.shot();
    sfx.hit();
    stage.shake(0.45);
  }, 1100 + i * 300)); // each brush stroke lands
  await sleep(1100 + crew.length * 300 + 600);
  box.hidden = true;
}

// All-Out finisher card: the hero who called it front and center over a spinning sunburst, the party behind.
async function finisher(caller, crew) {
  const box = $('#finisher');
  box.style.setProperty('--c', caller.color);
  box.querySelector('.crew').replaceChildren(...crew.filter(u => u.id !== caller.id).map(u => img(spriteURL(u.sprite, 'victory'))));
  box.querySelector('.hero').replaceChildren(img(cutin(caller.sprite, 'finisher') ?? cutin(caller.sprite, 'allout') ?? spriteURL(caller.sprite, 'strike')));
  box.querySelector('strong').textContent = caller.name;
  replay(box);
  sfx.finisher();
  stage.shake(0.8);
  await sleep(1600);
  box.hidden = true;
}

// Battle-entry transition: the title card shatters into tiles that blow apart, revealing the battlefield.
async function shatter(box) {
  const W = innerWidth, H = innerHeight;
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W * 0.6, H);
  grad.addColorStop(0.4, 'rgba(8, 6, 18, .92)');
  grad.addColorStop(1, 'rgba(60, 20, 30, .85)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  for (const node of box.querySelectorAll('h1, .kicker')) {
    const r = node.getBoundingClientRect(), cs = getComputedStyle(node), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    // canvas ignores CSS text-transform, so apply it by hand to match the live title
    const text = cs.textTransform === 'uppercase' ? node.textContent.toUpperCase() : node.textContent;
    g.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (node.tagName === 'H1') {
      g.fillStyle = '#000';
      g.fillText(text, cx + 4, cy + 4);
    }
    g.fillStyle = cs.color;
    g.fillText(text, cx, cy);
  }
  const url = c.toDataURL(), COLS = 12, ROWS = 8, tw = W / COLS, th = H / ROWS;
  const layer = $('#shatter'), tiles = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = el('div');
      Object.assign(t.style, {
        left: `${x * tw}px`, top: `${y * th}px`, width: `${tw + 1}px`, height: `${th + 1}px`,
        backgroundImage: `url(${url})`, backgroundSize: `${W}px ${H}px`, backgroundPosition: `-${x * tw}px -${y * th}px`,
      });
      tiles.push({ t, dx: x - COLS / 2 + 0.5, dy: y - ROWS / 2 + 0.5 });
    }
  }
  layer.replaceChildren(...tiles.map(({ t }) => t), el('div', 'flash'));
  layer.hidden = false;
  box.hidden = true;
  // tiles nearest the center break first and fly outward, then fall
  await Promise.all(tiles.map(({ t, dx, dy }) => t.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * 90}px, ${dy * 90 + 400}px) rotate(${(Math.random() - 0.5) * 540}deg) scale(.3)`, opacity: 0 },
  ], { duration: calm ? 1 : 900, delay: calm ? 0 : Math.hypot(dx, dy) * 45, easing: 'cubic-bezier(.5, 0, .8, .4)', fill: 'forwards' }).finished));
  layer.hidden = true;
}

async function nameCard(u) {
  const card = $('#namecard');
  card.querySelector('strong').textContent = u.name;
  card.querySelector('.face').replaceChildren(img(portrait(u.sprite)));
  replay(card);
  await sleep(950);
  card.hidden = true;
}

// Battle intro. The start button doubles as the click browsers require before playing audio.
async function intro() {
  const box = $('#intro'), start = box.querySelector('button');
  start.focus();
  await new Promise(r => start.addEventListener('click', r, { once: true }));
  startAudio();
  sfx.sting();
  await shatter(box);
  $('#bars').classList.add('on'); // cinematic letterbox for the enemy reveals
  for (const u of alive(state, 'enemy')) {
    stage.reveal(u.id);
    sfx.reveal();
    await nameCard(u);
  }
  $('#bars').classList.remove('on');
  await stage.focus(null, true);
  await banner('AMBUSH!', 'big');
}

async function loop() {
  await intro();
  while (!state.result) {
    renderHud();
    const actor = current(state);
    if (actor.side === 'party') await stage.focus(actor.id);
    const action = actor.side === 'party' ? await chooseAction(actor) : await enemyTurn(actor);
    await play(applyAction(state, action), action);
    if (actor.side === 'party') stats.turns++;
    for (const p of action.parries ?? []) {
      if (p === 'perfect') {
        stats.parries++;
        stats.streak++;
        stats.best = Math.max(stats.best, stats.streak);
      } else {
        stats.streak = 0;
      }
    }
  }
  renderHud();
  if (state.result === 'win') stage.victory(alive(state, 'party').map(u => u.id));
  fadeMusic();
  (state.result === 'win' ? sfx.victory : sfx.defeat)();
  const r = $('#result');
  r.querySelector('h1').textContent = state.result === 'win' ? 'Victory' : 'Defeat';
  r.querySelector('.stats').replaceChildren(...[
    ['Turns', stats.turns],
    ['Weakness hits', stats.weak],
    ['Perfect parries', stats.parries],
    ['Best parry streak', stats.best],
  ].map(([label, n]) => {
    const row = el('div');
    row.append(el('dt', '', label), el('dd', '', String(n)));
    return row;
  }));
  r.hidden = false;
  r.querySelector('button').focus();
}

renderHud();
loop();