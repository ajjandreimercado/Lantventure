// Battle HUD: party medallions with an arc HP gauge, the turn-order strip, floating enemy plates, the boss bar and the
// route tag. Built once and updated in place, so gauges can animate: update() syncs everything to a battle state,
// bump() moves one gauge as a hit lands, before the state catches up.
import { turnQueue, raging, MAX_AP } from './battle.js';

// 9x9 pixel icons, drawn as SVG squares so they stay crisp at any size.
const PX = {
  attack: ['........#', '.......#.', '......#..', '.....#...', '.#..#....', '..##.....', '..##.....', '.#..#....', '#........'],
  phys: ['........#', '.......#.', '......#..', '.....#...', '.#..#....', '..##.....', '..##.....', '.#..#....', '#........'],
  fire: ['....#....', '...##....', '...###...', '..####.#.', '..#####..', '.###.###.', '.##...##.', '.##...##.', '..#####..'],
  ice: ['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....'],
  elec: ['.....###.', '....###..', '...###...', '..######.', '.....##..', '....##...', '...##....', '..##.....', '.#.......'],
  wind: ['.######..', '.......#.', '.####..#.', '.....#...', '#######..', '.......#.', '.#####.#.', '......#..', '.........'],
  heal: ['...###...', '...#.#...', '...#.#...', '####.####', '#.......#', '####.####', '...#.#...', '...#.#...', '...###...'],
  aim: ['....#....', '..#####..', '.#..#..#.', '.#.....#.', '###.#.###', '.#.....#.', '.#..#..#.', '..#####..', '....#....'],
  baton: ['.....#...', '.....##..', '########.', '#########', '########.', '.....##..', '.....#...', '.........', '.........'],
  allout: ['....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.', '.........'],
  skull: ['..#####..', '.#######.', '#########', '##..#..##', '##..#..##', '#########', '.###.###.', '.#.#.#.#.', '.........'],
  check: ['.........', '........#', '.......##', '......##.', '#....##..', '##..##...', '.####....', '..##.....', '.........'],
  here: ['.........', '.........', '#########', '.#######.', '..#####..', '...###...', '....#....', '.........', '.........'],
};
export function icon(name) {
  const rects = [];
  (PX[name] ?? PX.attack).forEach((row, y) => [...row].forEach((c, x) => c === '#' && rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`)));
  return `<svg class="icon" viewBox="0 0 9 9" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects.join('')}</svg>`;
}

const $ = sel => document.querySelector(sel);
const el = (tag, cls = '', text = '') => Object.assign(document.createElement(tag), { className: cls, textContent: text });
// Route pips: one per stop, the boss stop drawn as a skull.
export function route(list, run, at) {
  list.replaceChildren(...run.map((stop, i) => {
    const li = el('li', i < at ? 'done' : i === at ? 'here' : '');
    li.innerHTML = i < at ? icon('check') : stop.arena === 'sanctum' ? icon('skull') : '';
    li.title = stop.name;
    return li;
  }));
}

export function createHud({ stage, portrait, run }) {
  const cards = new Map(), plates = new Map(), shown = new Map();
  let units = [], marked = null;
  // Name and arrow over the hero whose turn it is.
  const mark = el('div', 'turn-mark');
  mark.innerHTML = `<b></b>${icon('here')}`;
  $('#plates').append(mark);

  // A gauge's fill (--hp) moves fast; its pale trail (--trail) follows after a beat, so you see the chunk you lost.
  const gauge = (node, hp, max) => {
    const r = Math.max(0, hp / max);
    node.style.setProperty('--hp', r);
    node.style.setProperty('--trail', r);
    node.classList.toggle('mid', r > 0.25 && r <= 0.5);
    node.classList.toggle('low', r > 0 && r <= 0.25);
  };

  function card(u) {
    const c = el('div', 'card');
    c.style.setProperty('--c', u.color);
    c.innerHTML = '<div class="medal"><div class="arc"></div><b class="hpnum"></b></div>'
      + '<div class="info"><div class="name"></div><div class="ap" role="img"></div></div><span class="chip"></span>';
    c.querySelector('.arc').after(Object.assign(new Image(), { className: 'face', src: portrait(u.sprite), alt: '' }));
    c.querySelector('.name').textContent = u.name;
    $('#party').append(c);
    const refs = { c, num: c.querySelector('.hpnum'), ap: c.querySelector('.ap'), chip: c.querySelector('.chip') };
    cards.set(u.id, refs);
    return refs;
  }

  function plate(u) {
    const p = el('div', 'plate');
    p.innerHTML = '<div class="pl-top"><b></b><span class="aff"></span></div><div class="gauge-bar"><i class="trail"></i><i class="fill"></i></div><span class="chip"></span>';
    p.querySelector('b').textContent = u.name;
    $('#plates').append(p);
    const refs = { p, aff: p.querySelector('.aff'), chip: p.querySelector('.chip') };
    plates.set(u.id, refs);
    return refs;
  }

  // What you've learned about a foe's affinities, Persona-style; unknown ones stay a question mark.
  const affinities = (u, known) => {
    const facts = [...(known.get(u.id) ?? [])];
    if (!facts.length) return '<i class="unknown">?</i>';
    return facts.map(f => {
      const [kind, element] = f.split(' ');
      return `<i class="${kind === 'weak' ? 'wk' : 'rs'} el-${element}" title="${f}">${icon(element)}</i>`;
    }).join('');
  };

  function show(u, hp) {
    shown.set(u.id, hp);
    if (u.side === 'party') {
      const r = cards.get(u.id) ?? card(u);
      gauge(r.c, hp, u.maxHp);
      r.num.textContent = hp;
    } else if (u.boss) {
      gauge($('#bossbar'), hp, u.maxHp);
      $('#bossbar .bb-hp').textContent = `${hp} / ${u.maxHp}`;
    } else {
      gauge((plates.get(u.id) ?? plate(u)).p, hp, u.maxHp);
    }
  }

  function update(state, known) {
    units = state.units;
    const queue = turnQueue(state, 7), now = queue[0];
    for (const u of units) show(u, u.hp);
    const acting = state.result ? null : units.find(u => u.id === now);
    document.body.classList.toggle('foe-turn', acting?.side === 'enemy');
    marked = acting?.side === 'party' ? acting : null;
    mark.hidden = !marked;
    if (marked) {
      mark.style.setProperty('--c', marked.color);
      mark.querySelector('b').textContent = marked.name;
    }
    for (const u of units.filter(x => x.side === 'party')) {
      const { c, ap, chip } = cards.get(u.id);
      c.classList.toggle('active', u.id === now);
      c.classList.toggle('ko', u.hp === 0);
      c.classList.toggle('boosted', u.boost > 0);
      ap.setAttribute('aria-label', `AP ${u.ap} of ${MAX_AP}`);
      ap.replaceChildren(...Array.from({ length: MAX_AP }, (_, i) => el('b', i < u.ap ? 'on' : '')));
      chip.textContent = u.hp === 0 ? 'KO' : u.down ? 'DOWN' : u.boost ? `+${25 * u.boost}%` : '';
      chip.hidden = !chip.textContent;
    }
    // enemy plates: drop the ones from the last fight, refresh the rest
    const ids = new Set(units.map(u => u.id));
    for (const [id, { p }] of plates) if (!ids.has(id)) { p.remove(); plates.delete(id); }
    for (const u of units.filter(x => x.side === 'enemy' && !x.boss)) {
      const r = plates.get(u.id);
      r.p.classList.toggle('gone', u.hp === 0);
      r.p.classList.toggle('next', u.id === now);
      r.aff.innerHTML = affinities(u, known);
      r.chip.textContent = u.down ? 'DOWN' : '';
      r.chip.hidden = !u.down;
    }
    const boss = units.find(u => u.boss);
    $('#bossbar').hidden = !boss;
    if (boss) {
      const bar = $('#bossbar');
      bar.querySelector('.bb-skull').innerHTML = icon('skull');
      bar.querySelector('.bb-name').textContent = boss.name;
      bar.querySelector('.bb-aff').innerHTML = affinities(boss, known);
      bar.style.setProperty('--rage', boss.rage?.at ?? 0);
      bar.classList.toggle('raging', raging(boss));
      bar.querySelector('.bb-state').textContent = boss.down ? 'DOWN' : raging(boss) ? 'ENRAGED · 2 ACTIONS' : '';
    }
    // turn order: who acts now, then the next few
    $('#turns').replaceChildren(...queue.map((id, i) => {
      const u = units.find(x => x.id === id);
      const li = el('li', `${u.side === 'party' ? 'hero' : u.boss ? 'boss' : 'foe'}${i === 0 ? ' now' : ''}`);
      li.style.setProperty('--c', u.color ?? '#ff5a5a');
      li.append(Object.assign(new Image(), { src: portrait(u.sprite), alt: u.name }));
      if (i === 0) li.append(el('span', '', u.side === 'party' ? 'Now' : 'Foe'));
      return li;
    }));
  }

  // Enemy plates float over their heads and follow the camera.
  const follow = () => {
    for (const [id, { p }] of plates) {
      if (!units.some(u => u.id === id)) continue;
      const { x, y } = stage.screenPos(id, 1.12);
      p.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    }
    if (marked) {
      const { x, y } = stage.screenPos(marked.id, 1.02);
      mark.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
    }
    requestAnimationFrame(follow);
  };
  follow();

  return {
    update,
    // Move a gauge by delta HP right away (a hit or heal landing), ahead of the next update().
    bump(id, delta) {
      const u = units.find(x => x.id === id);
      if (u) show(u, Math.max(0, Math.min(u.maxHp, (shown.get(id) ?? u.hp) + delta)));
    },
    stop(i) {
      $('#where .stop-n').textContent = `Stop ${i + 1} / ${run.length}`;
      $('#where .stop-name').textContent = run[i].name;
      route($('#where .route'), run, i);
    },
    // Hide the HUD for cinematics (intros, travel, cut-ins).
    cinematic(on) { document.body.classList.toggle('cinematic', on); },
  };
}
