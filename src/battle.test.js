import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, applyAction, current, unit, canAllOut, enemyIntent, comboOf, batonTargets, turnQueue, raging } from './battle.js';

const hero = (id, speed, extra) => ({
  id, name: id, speed, maxHp: 100, ap: 5,
  attack: { element: 'phys', power: 10 },
  skills: [{ id: 'fire', element: 'fire', power: 20, ap: 2 }],
  ...extra,
});
const foe = (id, speed, extra) => ({ id, name: id, speed, maxHp: 100, attack: { element: 'phys', power: 10 }, skills: [], ...extra });
const fire = (actor, target) => ({ type: 'skill', actor, target, skill: 'fire' });

test('hitting a weakness knocks down and grants one more', () => {
  const s = createBattle([hero('a', 10)], [foe('x', 1, { weak: ['fire'] }), foe('y', 2)]);
  const { state, events } = applyAction(s, fire('a', 'x'));
  assert.equal(unit(state, 'x').hp, 70);
  assert.ok(unit(state, 'x').down);
  assert.equal(unit(state, 'a').ap, 3);
  assert.equal(current(state).id, 'a');
  assert.ok(events.some(e => e.type === 'oneMore'));
});

test('hitting an already downed foe gives no extra turn', () => {
  let s = createBattle([hero('a', 10)], [foe('x', 1, { weak: ['fire'] }), foe('y', 2)]);
  s = applyAction(s, fire('a', 'x')).state;
  s = applyAction(s, fire('a', 'x')).state;
  assert.equal(current(s).id, 'y');
});

test('all foes down enables all-out attack, which stands them up', () => {
  let s = createBattle([hero('a', 10)], [foe('x', 1, { weak: ['fire'] }), foe('y', 2, { weak: ['fire'] })]);
  s = applyAction(s, fire('a', 'x')).state;
  s = applyAction(s, fire('a', 'y')).state;
  assert.ok(canAllOut(s));
  s = applyAction(s, { type: 'allOut', actor: 'a' }).state;
  assert.equal(unit(s, 'x').hp, 57); // 70 - 10 power x 1.25
  assert.ok(!unit(s, 'x').down && !unit(s, 'y').down);
});

test('perfect parry negates damage, counters and refunds AP; no parry takes the hit', () => {
  const s = createBattle([hero('a', 1)], [foe('x', 10)]);
  const intent = enemyIntent(s);
  const parried = applyAction(s, { ...intent, parries: ['perfect'] }).state;
  assert.equal(unit(parried, 'a').hp, 100);
  assert.equal(unit(parried, 'x').hp, 90);
  assert.equal(unit(parried, 'a').ap, 6);
  assert.equal(unit(applyAction(s, { ...intent, parries: ['none'] }).state, 'a').hp, 90);
});

test('combos split damage per hit and only a full parry earns the counter', () => {
  const s = createBattle([hero('a', 1)], [foe('x', 10, { combo: [800, 500, 500], attack: { element: 'phys', power: 12 } })]);
  const intent = enemyIntent(s);
  const mixed = applyAction(s, { ...intent, parries: ['perfect', 'none', 'dodge'] });
  assert.equal(unit(mixed.state, 'a').hp, 96);
  assert.equal(unit(mixed.state, 'a').ap, 6);
  assert.ok(!mixed.events.some(e => e.type === 'counter'));
  const clean = applyAction(s, { ...intent, parries: ['perfect', 'perfect', 'perfect'] });
  assert.equal(unit(clean.state, 'x').hp, 90);
  assert.ok(clean.events.some(e => e.type === 'counter'));
  assert.throws(() => applyAction(s, { ...intent, parries: ['perfect'] }));
});

test('baton pass hands a One More turn to a teammate with a damage boost', () => {
  let s = createBattle([hero('a', 10), hero('b', 5)], [foe('x', 1, { weak: ['fire'] }), foe('y', 2)]);
  assert.throws(() => applyAction(s, { type: 'baton', actor: 'a', target: 'b' })); // no One More yet
  s = applyAction(s, fire('a', 'x')).state;
  const { state, events } = applyAction(s, { type: 'baton', actor: 'a', target: 'b' });
  assert.equal(current(state).id, 'b');
  assert.ok(events.some(e => e.type === 'baton'));
  assert.throws(() => applyAction(state, { type: 'baton', actor: 'b', target: 'a' })); // must earn its own One More
  const after = applyAction(state, { type: 'attack', actor: 'b', target: 'y' }).state;
  assert.equal(unit(after, 'y').hp, 87); // 10 power x 1.25 boost, rounded
  assert.equal(current(after).id, 'y'); // b used its turn early, so its regular slot this round is skipped
  assert.equal(unit(after, 'b').boost, 0);
});

test('enemies target a weakness they can exploit', () => {
  const s = createBattle([hero('a', 1), hero('b', 1, { weak: ['ice'] })], [foe('x', 10, { skills: [{ id: 'frost', element: 'ice', power: 10 }] })]);
  assert.deepEqual(enemyIntent(s), { type: 'enemyAttack', actor: 'x', target: 'b', skill: 'frost' });
});

test('a downed unit spends its next turn standing up', () => {
  let s = createBattle([hero('a', 10)], [foe('x', 5, { weak: ['fire'] }), foe('y', 1)]);
  s = applyAction(s, fire('a', 'x')).state;
  const { state, events } = applyAction(s, { type: 'attack', actor: 'a', target: 'y' });
  assert.equal(current(state).id, 'y');
  assert.ok(!unit(state, 'x').down);
  assert.ok(events.some(e => e.type === 'standUp'));
});

test('a weak-point shot pierces resistance, knocks down and grants one more', () => {
  const s = createBattle([hero('a', 10, { shots: 1 })], [foe('x', 1, { resist: ['phys'] })]);
  const { state, events } = applyAction(s, { type: 'shot', actor: 'a', target: 'x', hit: 'weakPoint' });
  assert.equal(unit(state, 'x').hp, 85);
  assert.ok(unit(state, 'x').down);
  assert.equal(current(state).id, 'a');
  assert.ok(events.some(e => e.type === 'oneMore'));
  assert.equal(unit(state, 'a').shots, 0);
  assert.equal(unit(state, 'a').ap, 4);
  assert.throws(() => applyAction(state, { type: 'shot', actor: 'a', target: 'x', hit: 'body' }));
});

test('body shots hit normally and misses still spend the shot', () => {
  const s = createBattle([hero('a', 10, { shots: 2 })], [foe('x', 1)]);
  const body = applyAction(s, { type: 'shot', actor: 'a', target: 'x', hit: 'body' }).state;
  assert.equal(unit(body, 'x').hp, 90);
  assert.ok(!unit(body, 'x').down);
  const missed = applyAction(s, { type: 'shot', actor: 'a', hit: 'miss' }).state;
  assert.equal(unit(missed, 'x').hp, 100);
  assert.equal(unit(missed, 'a').shots, 1);
});

test('battle is won when every foe is KO', () => {
  const s = createBattle([hero('a', 10)], [foe('x', 1, { maxHp: 10 })]);
  const { state } = applyAction(s, { type: 'attack', actor: 'a', target: 'x' });
  assert.equal(state.result, 'win');
  assert.throws(() => applyAction(state, { type: 'attack', actor: 'a', target: 'x' }));
});

test('a run carries HP into the next fight, and a raging boss needs more parries', () => {
  const s = createBattle([hero('a', 1, { hp: 40 })], [foe('boss', 10, { combo: [500], rage: { at: 0.5, combo: [500, 300] } })]);
  assert.equal(unit(s, 'a').hp, 40);
  assert.equal(comboOf(unit(s, 'boss')).length, 1);
  unit(s, 'boss').hp = 50;
  assert.equal(comboOf(unit(s, 'boss')).length, 2);
  assert.throws(() => applyAction(s, { type: 'enemyAttack', actor: 'boss', target: 'a', parries: ['none'] }));
  const { state } = applyAction(s, { type: 'enemyAttack', actor: 'boss', target: 'a', parries: ['none', 'none'] });
  assert.equal(unit(state, 'a').hp, 30);
});

test('baton pass only goes to teammates who have not acted this round', () => {
  // order: a, b, c, then foes
  let s = createBattle([hero('a', 30), hero('b', 20), hero('c', 10)], [foe('x', 1, { weak: ['fire'] }), foe('y', 2, { weak: ['fire'] })]);
  s = applyAction(s, { type: 'attack', actor: 'a', target: 'x' }).state; // a acts normally
  s = applyAction(s, fire('b', 'x')).state; // b knocks x down: One More
  assert.deepEqual(batonTargets(s).map(u => u.id), ['c']); // a already acted this round
  assert.throws(() => applyAction(s, { type: 'baton', actor: 'b', target: 'a' }));
  s = applyAction(s, { type: 'baton', actor: 'b', target: 'c' }).state;
  s = applyAction(s, { type: 'attack', actor: 'c', target: 'y' }).state;
  assert.equal(current(s).id, 'y'); // c's own slot is used up; the foes go next
  assert.deepEqual(s.acted, ['a', 'b', 'c']);
});

test('a new round clears who has acted, and the turn queue looks ahead', () => {
  let s = createBattle([hero('a', 30), hero('b', 20)], [foe('x', 1)]);
  assert.deepEqual(turnQueue(s, 5), ['a', 'b', 'x', 'a', 'b']);
  s = applyAction(s, { type: 'attack', actor: 'a', target: 'x' }).state;
  s = applyAction(s, { type: 'attack', actor: 'b', target: 'x' }).state;
  s = applyAction(s, { ...enemyIntent(s), parries: ['none'] }).state;
  assert.equal(current(s).id, 'a');
  assert.deepEqual(s.acted, []);
});

test('a unit with turns: 2 acts twice a round', () => {
  const s = createBattle([hero('a', 30), hero('b', 20)], [foe('boss', 25, { turns: 2 })]);
  assert.deepEqual(turnQueue(s, 5), ['a', 'boss', 'b', 'boss', 'a']);
});

test('healing skills target allies, never overheal, and cannot target foes', () => {
  const mend = { id: 'mend', element: 'heal', power: 30, ap: 2, heal: true };
  const s = createBattle([hero('a', 10, { skills: [mend] }), hero('b', 5, { hp: 50 })], [foe('x', 1)]);
  const { state, events } = applyAction(s, { type: 'skill', actor: 'a', target: 'b', skill: 'mend' });
  assert.equal(unit(state, 'b').hp, 80);
  assert.ok(events.some(e => e.type === 'heal' && e.amount === 30));
  const capped = applyAction(s, { type: 'skill', actor: 'a', target: 'a', skill: 'mend' });
  assert.equal(unit(capped.state, 'a').hp, 100);
  assert.throws(() => applyAction(s, { type: 'skill', actor: 'a', target: 'x', skill: 'mend' }));
});

test('a raging boss earns its second turn only below the rage threshold', () => {
  const s = createBattle([hero('a', 30), hero('b', 20)], [foe('boss', 25, { rage: { at: 0.5, turns: 2 } })]);
  assert.deepEqual(turnQueue(s, 4), ['a', 'boss', 'b', 'a']);
  unit(s, 'boss').hp = 40;
  assert.ok(raging(unit(s, 'boss')));
  assert.deepEqual(turnQueue(s, 5), ['a', 'boss', 'b', 'boss', 'a']);
});
