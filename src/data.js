// Content is data: add a hero, enemy or skill by adding an entry here.
// `sprite` names a drawing in sprites.js. Skills cast from range unless marked `melee`; basic attacks are melee.
// `fx` is each character's signature look: light (a glowing light source on them), aura (particles drifting off
// them), decal (a ring on the floor under them), ghost (afterimages when dashing), heavy (dust and a jolt on each
// step in), hitBurst / koBurst (particles when hit / knocked out). Melee skills can add a floor effect with `fx`.
// `color` is a hero's signature color for cut-ins; `cam` picks their turn camera: low (heroic, looking up),
// dutch (tilted power angle) or orbit (slow drift around them).
// `combo` is ms until each hit of an enemy's attack lands: more entries = more parries, smaller = faster.
// `weakPoint` is where free-aim shots crit: x from -1 (left edge) to 1, y from 0 (feet) to 1 (head).
export const ELEMENT_COLOR = { phys: '#ffffff', fire: '#ff7a3c', ice: '#7fd8ff', elec: '#ffe66b', wind: '#7dffb0' };

export const party = [
  {
    id: 'lumen', name: 'Lumen', speed: 12, maxHp: 90, ap: 2, shots: 3, weak: ['ice'],
    attack: { element: 'phys', power: 12 },
    skills: [
      { id: 'ember', name: 'Ember', element: 'fire', power: 24, ap: 2 },
      { id: 'zephyr', name: 'Zephyr', element: 'wind', power: 24, ap: 2 },
      { id: 'pyre', name: 'Pyre', element: 'fire', power: 42, ap: 4 },
    ],
    sprite: 'lumen', color: '#e0675a', cam: 'low', fx: { light: '#ff9a3c', aura: '#ffb347' },
  },
  {
    id: 'brann', name: 'Brann', speed: 8, maxHp: 130, ap: 2, shots: 3, weak: ['elec'],
    attack: { element: 'phys', power: 18 },
    skills: [
      { id: 'cleave', name: 'Gale Cleave', element: 'wind', power: 26, ap: 2, melee: true },
      { id: 'shatter', name: 'Shatter', element: 'phys', power: 36, ap: 3, melee: true, fx: 'crack' },
    ],
    sprite: 'brann', color: '#5f93b3', cam: 'dutch', fx: { heavy: true },
  },
  {
    id: 'sela', name: 'Sela', speed: 14, maxHp: 80, ap: 2, shots: 3, weak: ['fire'],
    attack: { element: 'phys', power: 11 },
    skills: [
      { id: 'frost', name: 'Frost', element: 'ice', power: 24, ap: 2 },
      { id: 'volt', name: 'Volt', element: 'elec', power: 24, ap: 2 },
    ],
    sprite: 'sela', color: '#8fd8f0', cam: 'orbit', fx: { light: '#7fd8ff', decal: 'frost' },
  },
];

export const enemies = [
  {
    id: 'wisp', name: 'Mire Wisp', speed: 10, maxHp: 70, weak: ['ice'], resist: ['fire'],
    attack: { element: 'phys', power: 12 },
    skills: [{ id: 'spark', name: 'Spark', element: 'elec', power: 16 }],
    combo: [1150], sprite: 'wisp', glow: true, fx: { ghost: true, koBurst: '#9fffd9' }, float: true, weakPoint: { x: 0, y: 0.45 },
  },
  {
    id: 'knight', name: 'Rust Knight', speed: 6, maxHp: 120, weak: ['elec', 'fire'], resist: ['phys'],
    attack: { element: 'phys', power: 16 },
    skills: [{ id: 'irongale', name: 'Iron Gale', element: 'wind', power: 18 }],
    combo: [1250, 750], sprite: 'knight', fx: { heavy: true, hitBurst: '#9a4e2a' }, weakPoint: { x: 0, y: 0.81 },
  },
  {
    id: 'hound', name: 'Ash Hound', speed: 13, maxHp: 80, weak: ['wind'],
    attack: { element: 'phys', power: 14 },
    skills: [{ id: 'cinder', name: 'Cinder Bite', element: 'fire', power: 18 }],
    combo: [800, 480, 480], sprite: 'hound', fx: { light: '#ff7a2c', aura: '#ff7a2c', hitBurst: '#ffb347' }, weakPoint: { x: 0, y: 0.3 },
  },
];
