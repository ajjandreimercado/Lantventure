// Battle music from a file; sound effects are synthesized chiptune blips with Web Audio, so there are no
// extra assets. Browsers only allow audio after a user gesture, so call startAudio() from a click.
let ctx, master, music, muted = false;

export function startAudio() {
  if (ctx) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  music = Object.assign(new Audio('assets/audio/battle.mp3'), { loop: true, volume: 0.35 });
  music.play().catch(() => {}); // a blocked or missing track must never break the battle
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.5;
  if (music) music.muted = muted;
  return muted;
}

export function fadeMusic(ms = 1500) {
  if (!music) return;
  const from = music.volume, t0 = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    music.volume = from * (1 - t);
    if (t < 1) requestAnimationFrame(step);
    else music.pause();
  };
  step();
}

function tone({ type = 'square', from, to = from, dur = 0.12, vol = 0.15, at = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + at, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur);
}

function noise({ dur = 0.2, vol = 0.2, freq = 1200, to = freq, at = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + at;
  const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, t);
  filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filter).connect(g).connect(master);
  src.start(t);
}

const arp = (notes, step = 0.07, opts = {}) => notes.forEach((f, i) => tone({ from: f, dur: step * 1.6, at: i * step, ...opts }));

export const sfx = {
  move: () => tone({ from: 660, dur: 0.04, vol: 0.05 }),
  confirm: () => arp([660, 990], 0.05, { vol: 0.08 }),
  cancel: () => arp([440, 330], 0.05, { vol: 0.08 }),
  hit: () => { noise({ dur: 0.12, freq: 900, to: 300, vol: 0.3 }); tone({ type: 'triangle', from: 160, to: 60, dur: 0.15, vol: 0.3 }); },
  weak: () => { sfx.hit(); tone({ from: 1320, to: 1760, dur: 0.12, vol: 0.1, at: 0.05 }); },
  resist: () => tone({ type: 'triangle', from: 220, to: 180, dur: 0.12, vol: 0.2 }),
  fire: () => noise({ dur: 0.45, freq: 500, to: 2500, vol: 0.25 }),
  ice: () => arp([2093, 2637, 3136], 0.04, { type: 'triangle', vol: 0.1 }),
  elec: () => { for (let i = 0; i < 5; i++) tone({ type: 'sawtooth', from: 1800 - i * 200, to: 200, dur: 0.05, vol: 0.12, at: i * 0.04 }); },
  wind: () => noise({ dur: 0.5, freq: 400, to: 3000, vol: 0.18 }),
  shot: () => { noise({ dur: 0.08, freq: 3000, to: 800, vol: 0.3 }); tone({ from: 900, to: 120, dur: 0.12, vol: 0.12 }); },
  miss: () => noise({ dur: 0.25, freq: 2500, to: 600, vol: 0.1 }),
  parry: () => { tone({ from: 1975, dur: 0.25, vol: 0.12 }); tone({ type: 'triangle', from: 2960, dur: 0.3, vol: 0.1 }); },
  dodge: () => noise({ dur: 0.2, freq: 600, to: 2400, vol: 0.12 }),
  down: () => tone({ type: 'triangle', from: 300, to: 90, dur: 0.25, vol: 0.25 }),
  oneMore: () => arp([523, 659, 784, 1047], 0.06),
  ko: () => tone({ from: 440, to: 55, dur: 0.5, vol: 0.15 }),
  sting: () => arp([196, 233, 294, 392], 0.08, { type: 'sawtooth', vol: 0.1 }),
  reveal: () => tone({ from: 110, to: 220, dur: 0.18, vol: 0.12 }),
  brawl: () => noise({ dur: 0.08, freq: 400 + Math.random() * 1200, vol: 0.25 }),
  baton: () => { noise({ dur: 0.07, freq: 2600, vol: 0.35 }); arp([784, 1047, 1319, 1568], 0.05, { vol: 0.1 }); },
  finisher: () => { noise({ dur: 0.6, freq: 200, to: 4000, vol: 0.3 }); arp([392, 523, 784], 0.05, { type: 'sawtooth', vol: 0.12 }); },
  victory: () => arp([523, 523, 523, 659, 587, 659, 784], 0.11, { vol: 0.12 }),
  defeat: () => arp([392, 330, 262, 196], 0.18, { type: 'triangle', vol: 0.15 }),
};
