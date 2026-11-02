// Pure battle rules: no DOM or Three.js, so the logic is testable and the UI just plays back events.
export const MAX_AP = 9;

export function createBattle(party, enemies) {
  const units = [
    ...party.map(u => ({ ...u, side: 'party' })),
    ...enemies.map(u => ({ ...u, side: 'enemy' })),
  ].map(u => ({ ...u, hp: u.maxHp, ap: u.ap ?? 0, shots: u.shots ?? 0, boost: 0, down: false }));
  const order = [...units].sort((a, b) => b.speed - a.speed).map(u => u.id);
  // override: a baton-pass receiver acting out of order; bonus: this is a One More turn; chain: who already passed
  return { units, order, turn: 0, oneMore: false, override: null, bonus: false, chain: [], result: null };
}

export const unit = (s, id) => s.units.find(u => u.id === id);
export const current = s => unit(s, s.override ?? s.order[s.turn]);
export const alive = (s, side) => s.units.filter(u => u.side === side && u.hp > 0);
export const canAllOut = s => current(s).side === 'party' && alive(s, 'enemy').every(u => u.down);
// Persona baton pass: on a One More turn, hand the turn to a teammate who hasn't passed yet in this chain.
export const batonTargets = s => (s.bonus && current(s).side === 'party'
  ? alive(s, 'party').filter(u => u.id !== current(s).id && !s.chain.includes(u.id))
  : []);

// Enemies go for a weakness they can hit, otherwise the weakest party member.
export function enemyIntent(s) {
  const actor = current(s);
  const targets = alive(s, 'party');
  for (const t of targets) {
    const skill = actor.skills.find(k => t.weak?.includes(k.element));
    if (skill) return { type: 'enemyAttack', actor: actor.id, target: t.id, skill: skill.id };
  }
  const t = targets.reduce((a, b) => (b.hp < a.hp ? b : a));
  return { type: 'enemyAttack', actor: actor.id, target: t.id };
}

// action.parries (enemy turns only): one of 'perfect' | 'dodge' | 'none' per hit of the enemy's combo
// action.hit (free-aim shots only): 'weakPoint' | 'body' | 'miss', judged by the UI
export function applyAction(prev, action) {
  if (prev.result) throw new Error('battle is over');
  const s = structuredClone(prev);
  const ev = [];
  const actor = current(s);
  if (action.actor !== actor.id) throw new Error(`not ${action.actor}'s turn`);
  const target = unit(s, action.target);
  if (action.type === 'attack' || action.type === 'skill' || (action.type === 'shot' && action.hit !== 'miss')) {
    if (!target || target.hp === 0 || target.side === actor.side) throw new Error('invalid target');
  }

  if (action.type === 'baton') {
    if (!batonTargets(s).some(u => u.id === action.target)) throw new Error('cannot baton pass');
    s.chain.push(actor.id);
    s.override = target.id;
    s.bonus = false; // the receiver needs its own One More to pass again
    target.boost = s.chain.length;
    ev.push({ type: 'baton', actor: actor.id, target: target.id });
    return { state: s, events: ev };
  }

  if (action.type === 'attack') {
    hit(s, ev, actor, target, actor.attack);
    actor.ap = Math.min(MAX_AP, actor.ap + 1);
  } else if (action.type === 'skill') {
    const skill = actor.skills.find(k => k.id === action.skill);
    if (!skill || actor.ap < skill.ap) throw new Error('cannot use skill');
    actor.ap -= skill.ap;
    hit(s, ev, actor, target, skill);
  } else if (action.type === 'shot') {
    if (actor.shots < 1 || actor.ap < 1) throw new Error('cannot shoot');
    actor.shots -= 1;
    actor.ap -= 1;
    // A weak-point shot counts as hitting a weakness, so it can knock down and earn One More.
    if (action.hit === 'miss') ev.push({ type: 'miss', actor: actor.id });
    else hit(s, ev, actor, target, { element: 'phys', power: actor.attack.power }, action.hit === 'weakPoint');
  } else if (action.type === 'allOut') {
    if (!canAllOut(s)) throw new Error('enemies are not all down');
    const power = Math.round(alive(s, 'party').reduce((n, u) => n + u.attack.power, 0) * 1.5);
    ev.push({ type: 'allOut', actor: actor.id });
    for (const e of alive(s, 'enemy')) {
      e.down = false;
      damage(ev, actor, e, power);
    }
  } else if (action.type === 'enemyAttack') {
    const move = actor.skills.find(k => k.id === action.skill) ?? actor.attack;
    const results = action.parries ?? [];
    const hits = actor.combo?.length ?? 1;
    if (results.length !== hits) throw new Error(`expected ${hits} parry results`);
    const share = { ...move, power: Math.max(1, Math.round(move.power / hits)) }; // a combo splits the move's damage
    for (const r of results) {
      if (target.hp === 0) break;
      if (r === 'perfect') {
        target.ap = Math.min(MAX_AP, target.ap + 1);
        ev.push({ type: 'parry', actor: target.id, target: actor.id });
      } else if (r === 'dodge') {
        ev.push({ type: 'dodge', actor: target.id });
      } else {
        hit(s, ev, actor, target, share);
      }
    }
    // Expedition 33 rule: parry every hit of the combo to earn a counterattack.
    if (results.every(r => r === 'perfect')) {
      ev.push({ type: 'counter', actor: target.id, target: actor.id });
      damage(ev, target, actor, target.attack.power);
    }
  } else {
    throw new Error(`unknown action ${action.type}`);
  }

  actor.boost = 0;
  if (!alive(s, 'enemy').length) s.result = 'win';
  else if (!alive(s, 'party').length) s.result = 'lose';
  if (s.result) ev.push({ type: 'end', result: s.result });
  else advance(s, ev);
  return { state: s, events: ev };
}

function damage(ev, actor, target, dmg, extra) {
  target.hp = Math.max(0, target.hp - dmg);
  ev.push({ type: 'hit', actor: actor.id, target: target.id, dmg, ...extra });
  if (target.hp === 0) {
    target.down = false;
    ev.push({ type: 'ko', target: target.id });
  }
}

function hit(s, ev, actor, target, move, weakPoint = false) {
  const weak = weakPoint || !!target.weak?.includes(move.element);
  const resist = !!target.resist?.includes(move.element);
  const wasDown = target.down;
  const mult = (weak ? 1.5 : resist ? 0.5 : 1) * (1 + 0.25 * actor.boost);
  damage(ev, actor, target, Math.round(move.power * mult), { element: move.element, weak, resist });
  // Persona rule: knocking down a standing foe via weakness grants One More.
  if (weak && !wasDown) {
    if (target.hp > 0) {
      target.down = true;
      ev.push({ type: 'down', target: target.id });
    }
    s.oneMore = true;
    ev.push({ type: 'oneMore', actor: actor.id });
  }
}

function advance(s, ev) {
  if (s.oneMore) {
    s.oneMore = false;
    s.bonus = true;
    return;
  }
  s.override = null;
  s.bonus = false;
  s.chain = [];
  // Downed units spend their turn standing up. Two passes always find someone: the first clears every down.
  for (let i = 0; i < s.order.length * 2; i++) {
    s.turn = (s.turn + 1) % s.order.length;
    const u = current(s);
    if (u.hp === 0) continue;
    if (u.down) {
      u.down = false;
      ev.push({ type: 'standUp', target: u.id });
      continue;
    }
    return;
  }
}
