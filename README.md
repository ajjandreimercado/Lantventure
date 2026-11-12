# Lantern Expedition

A turn-based pixel-art battle in the browser, in the HD-2D style: hand-made pixel sprites standing in a lit 3D
diorama with bloom, tilt-shift blur and dynamic shadows. The combat mixes Persona-style weakness rules with
Expedition 33-style real-time defense.

![Battle, over the shoulder](docs/battle.jpg)

| Baton Pass | All-Out Attack | Finisher |
|---|---|---|
| ![Baton pass](docs/baton-pass.jpg) | ![All-Out brush strokes](docs/all-out.jpg) | ![Finisher card](docs/finisher.jpg) |

## Features

**Combat**
- **Weaknesses and One More.** Hit a weakness to knock an enemy down and earn another turn. Knock every enemy
  down to unlock the **All-Out Attack**.
- **Baton Pass.** On a One More turn, hand your turn to a teammate who hasn't acted yet this round (Persona's
  rule) for a damage boost that grows with each pass. The receiver uses up their own turn by acting early.
- **Free Aim.** Spend a shot to aim at an enemy's glowing weak point. A weak-point hit counts as a weakness, even
  through resistances.
- **Combo parries.** Each enemy attacks with its own rhythm of 1–3 hits. Parry (tight window) or dodge (loose
  window) each one, and parry a whole combo to counterattack.
- **AP economy.** Attacks and parries build AP, and skills spend it. Ranged spells are cast from where the hero
  stands, while melee skills close the distance. Sela's Mend heals an ally.
- **A three-stop run.** The Ruined Gate, the Moonlit Cloister, then the Lantern Warden's sanctum. Rest at camp
  between stops. The Warden enrages at half HP: faster combos and two actions a round. Lose a fight and you can
  retry it with the HP you walked in with.
- **Balanced by simulation.** Enemy numbers were tuned by playing the run thousands of times with a scripted
  player at several parry skill levels, so the difficulty climbs from stop to stop.

**Presentation**
- Over-the-shoulder camera with a personality per hero: a low heroic angle, a tilted dutch angle, or a slow orbit.
  It holds one steady shot per turn: the acting hero gets a gold ring, their name overhead and the others dim.
  Enemy turns cut to a high shot from behind the party with a red ring under the attacker and red screen edges.
- Every sprite is drawn in code with front, back and side views, a 4-frame idle, smear frames, knockdown and
  victory poses, and auto-generated normal maps so torches and spells shade them like rounded forms.
- Cut-ins: a split-panel Baton Pass where the giver throws the lantern and the receiver catches it, and an All-Out sequence of eye cut-ins, brush
  strokes and a finisher card.
- A shattering intro transition, a letterboxed enemy reveal, hit stop, and particles and lights for each character.
- Iris transitions between stops, each with its own arena art and mood (ruins, a moonlit cloister, the sanctum);
  a hazard-tape warning before the boss. Sela's Mend plays its own green healing effect.
- A game-style HUD: party medallions with a segmented arc HP gauge (with a damage trail), a turn-order strip,
  floating enemy plates that show discovered weaknesses, and a boss bar that marks where the boss enrages.
- Chiptune sound effects synthesized with the Web Audio API.

## Controls

| Action | Keyboard | Mouse / touch |
|---|---|---|
| Choose commands and targets | Arrow keys / Enter, Esc to go back | Click / tap |
| Parry an enemy hit | **Space** as the ring meets the circle | Parry button |
| Dodge an enemy hit | **D** | Dodge button |
| Free Aim | Arrow keys (Shift for fine), Enter to fire | Point and click |

## Run it locally

No build step. Serve the folder with any static server, then open http://localhost:5173.

```bash
python -m http.server 5173
```

Run the rules tests (Node 20+):

```bash
node --test
```

## How it's built

| File | What it does |
|---|---|
| `src/battle.js` | Pure battle rules with no DOM or 3D: turns and rounds, weaknesses, One More, baton pass, heals, combos, boss rage, All-Out. Covered by `src/battle.test.js`. |
| `src/data.js` | Heroes, enemies, skills, combo timings, the run's stops and each character's visual signature, all as data. |
| `src/hud.js` | The battle HUD: party medallions with the arc HP gauge, turn-order strip, enemy plates, boss bar, route tag and pixel icons. |
| `src/sprites.js` | Procedural pixel art: shapes on a small grid, then shading, rim light and outline passes. Every pose and view comes from the same drawing code. Also draws all the spell effects. |
| `src/sheets.js` | Loads hand-made sprite sheets: keys out the magenta background, crops front/back/side views and builds the pose frames. |
| `src/stage.js` | The Three.js scene: billboard sprites, view selection, normal maps, lighting, particles, the camera director and post-processing. |
| `src/main.js` | The battle flow, menus, parry and aim input, and the 2D cut-ins. |
| `src/audio.js` | Battle music playback and synthesized sound effects. |

The rules engine only returns events. The presentation layer plays them back, which keeps the logic testable and
lets the visuals change without touching the game rules.

Built with [Three.js](https://threejs.org) 0.160 (loaded from a CDN) and the
[Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) font.

## Credits

- Code, effects art and sound effects: original to this project.
- Character sprite sheets (`assets/sprites/`): generated with Google Gemini from this project's character designs and
  palettes, then keyed and posed in code (`src/sheets.js`). The original code-drawn sprites in `src/sprites.js`
  remain as the fallback.
- Boss arena textures (`assets/sprites/env-sanctum-*.png`): generated with SpriteCook. Their asset IDs are recorded in
  `spritecook-assets.json`.
- Skill effects (`assets/sprites/fx-*.png`, including the heal) and the ruins and cloister arena art
  (`assets/sprites/env-ruins-*.png`, `env-cloister-*.png`): generated with SpriteMaker, then recentred into one-row
  strips; the cloister tiles are darkened to the ruins tiles' brightness. The code-drawn effects in `src/sprites.js` remain as the fallback.
- Battle music: "8 BIT RPG BATTLE", a no-copyright retro game track. Check the track's own license terms before
  reusing it.
