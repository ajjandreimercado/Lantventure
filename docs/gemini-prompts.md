# Gemini sprite prompts: main characters

Use **one Gemini chat per character**:

1. Paste **Prompt 0** with that character's existing sheet attached (`assets/sprites/<name>.jpg`). This sets the style and design for the whole chat.
2. Then send the numbered prompts one at a time.
3. Save each result under the file name shown, in `assets/sprites/`.
4. If a result drifts off-model, re-attach the reference image and add: *"Match the reference exactly."*

All battle animation sheets use the same layout: **one horizontal row, frames left to right in time order, every frame a 64x64 cell, the character the same size with feet on the same baseline in every frame, on a flat magenta (#FF00FF) background.**

---

## Lumen (fire mage)

### Prompt 0: lock the style and design
```
You are making pixel art sprites for an HD-2D style JRPG battle (original game, Octopath-like mood).
Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no text, no watermark.
- 1-pixel dark outline (#1a1220), light from the upper left.
- Flat solid magenta #FF00FF background, nothing else behind the character.
- Keep the character EXACTLY as in the attached reference: same design, colors, proportions.

Character: Lumen, a young fire mage, chibi proportions. Short messy white hair with one tuft on top, warm skin,
purple eyes. Crimson hooded cloak with gold trim down the front and along the hem, dark trousers, brown boots.
Wooden staff topped with a glowing orange fire gem, held in the right hand.
Palette: hair #e8e1d0, skin #f2c9a0, cloak #b8433a, cloak shadow #8a2f2c, trim #f5d36b, boots #2a1e1a,
staff #7a5233, gem #ff9a3c, eyes #2a1a3a.
Reply "ready" and wait for the next prompt.
```

### Battle animations (back view, as the battle camera sees them)
1. **`lumen-back-idle.png`**
   `Back view, idle, 4 frames: gentle breathing loop, the cloak hem and hair tuft sway slightly, staff held upright, gem pulsing.`
2. **`lumen-back-attack.png`**
   `Back view, basic attack, 6 frames: crouch and pull the staff back, lunge forward, swing the staff in a wide arc with an orange motion smear, follow through, recover to stance.`
3. **`lumen-back-cast.png`**
   `Back view, casting fire, 5 frames: raise the staff overhead, a glowing orange magic circle forms on the ground under her, embers swirl up, thrust the staff forward releasing a burst of flame, settle.`
4. **`lumen-back-hurt.png`**
   `Back view, taking a hit, 3 frames: jolt backward with the cloak flaring, flinch hunched over, recover to stance.`
5. **`lumen-back-parry.png`**
   `Back view, perfect parry, 3 frames: snap the staff up crosswise to block, a bright white spark at the point of impact, then a ready-to-counter stance.`
6. **`lumen-back-dodge.png`**
   `Back view, dodge, 3 frames: lean to the left, hop sideways with the cloak trailing, land crouched.`
7. **`lumen-back-down.png`**
   `Back view, knocked down, 2 frames looping: sitting dazed on the ground, staff fallen beside her, swaying slightly.`
8. **`lumen-back-ko.png`**
   `Back view, knocked out, 4 frames: stagger, drop to her knees, fall forward, lying still.`
9. **`lumen-back-victory.png`**
   `Back view, victory, 4 frames: spin the staff, raise it high overhead, the gem flares bright, hold the pose.`

### Front view (cut-ins and front-facing shots)
10. **`lumen-front-idle.png`**
    `Front view facing the viewer, idle, 4 frames: breathing loop, small confident smile, gem pulsing.`
11. **`lumen-front-victory.png`**
    `Front view facing the viewer, victory, 4 frames: raise the staff high, wink, grin, cloak blowing.`

### Cut-in art
12. **`lumen-portrait.png`**
    `Larger 128x128 head-and-shoulders portrait, facing 3/4 toward the viewer, confident smirk, hood down, a warm orange rim light from the gem. More detail than the battle sprites but the same pixel style.`
13. **`lumen-eyes.png`**
    `A wide 256x64 close-up strip of only Lumen's eyes and brows, intense focused glare, purple eyes with a fiery orange glint, dramatic shading.`
14. **`lumen-baton-throw.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: tossing a glowing brass lantern underhand to someone off to the right, arm extended, playful wink.`
15. **`lumen-baton-catch.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: catching a glowing brass lantern in both hands, excited open-mouthed grin, sparks around the lantern.`
16. **`lumen-allout.png`**
    `Larger 192x192 full-body action pose: mid-leap toward the right, staff swung back trailing a huge arc of fire, cloak streaming, speed lines.`
17. **`lumen-finisher.png`**
    `Larger 192x192 heroic finishing pose, front view: staff planted beside her, the gem blazing, embers rising, cloak billowing, a confident smile, an orange rim light.`

---

## Brann (axe warrior)

### Prompt 0: lock the style and design
```
You are making pixel art sprites for an HD-2D style JRPG battle (original game, Octopath-like mood).
Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no text, no watermark.
- 1-pixel dark outline (#141018), light from the upper left.
- Flat solid magenta #FF00FF background, nothing else behind the character.
- Keep the character EXACTLY as in the attached reference: same design, colors, proportions.

Character: Brann, a broad-shouldered axe warrior, chibi proportions. Spiky brown hair, tan skin, short stubble,
determined brown eyes. Steel-blue sleeveless tunic with a silver belt and trim, leather wrist guards, dark boots.
A big single-bladed battle axe; when idle it is slung diagonally across his back on a leather strap.
Palette: hair #5a3a22, skin #d9a77e, tunic #3f6e8c, tunic shadow #2c5068, trim #c9cfd6, boots #1e1a18,
axe head #a9b3bd, axe handle #5a3d26.
Reply "ready" and wait for the next prompt.
```

### Battle animations (back view)
1. **`brann-back-idle.png`**
   `Back view, idle, 4 frames: heavy breathing loop, shoulders rising and falling, axe slung on his back, weight shifting.`
2. **`brann-back-attack.png`**
   `Back view, basic attack, 6 frames: pull the axe off his back, heave it overhead with both hands, lunge, slam it down in a wide arc with a white motion smear, dust kicking up, recover.`
3. **`brann-back-skill.png`**
   `Back view, wind skill "Gale Cleave", 5 frames: swirling green wind gathers around the axe head, spin once, cleave horizontally with a green wind slash trailing the blade, settle.`
4. **`brann-back-slam.png`**
   `Back view, power skill "Shatter", 5 frames: leap up with the axe raised, crash it into the ground, the floor cracks with flying rubble, stand back up.`
5. **`brann-back-hurt.png`**
   `Back view, taking a hit, 3 frames: shoved back a step, grit teeth and brace, recover.`
6. **`brann-back-parry.png`**
   `Back view, perfect parry, 3 frames: swing the axe handle up to block, a bright white spark at impact, counter-ready stance.`
7. **`brann-back-dodge.png`**
   `Back view, dodge, 3 frames: heavy shoulder roll to the left, come up on one knee, stand.`
8. **`brann-back-down.png`**
   `Back view, knocked down, 2 frames looping: on one knee leaning on the axe, dazed, breathing hard.`
9. **`brann-back-ko.png`**
   `Back view, knocked out, 4 frames: stagger, the axe drops, fall to his knees, collapse forward.`
10. **`brann-back-victory.png`**
    `Back view, victory, 4 frames: rest the axe on his shoulder, pump a fist in the air, hold.`

### Front view
11. **`brann-front-idle.png`**
    `Front view facing the viewer, idle, 4 frames: breathing loop, arms crossed, smirk, axe over his shoulder.`
12. **`brann-front-victory.png`**
    `Front view facing the viewer, victory, 4 frames: hoist the axe overhead with one arm, big laughing grin.`

### Cut-in art
13. **`brann-portrait.png`**
    `Larger 128x128 head-and-shoulders portrait, facing 3/4 toward the viewer, cocky grin, a small scar on the cheek, a steel-blue rim light.`
14. **`brann-eyes.png`**
    `A wide 256x64 close-up strip of only Brann's eyes and heavy brows, fierce determined glare, a blue glint.`
15. **`brann-baton-throw.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: tossing a glowing brass lantern overhand to someone off to the right, laughing.`
16. **`brann-baton-catch.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: catching a glowing brass lantern one-handed, fired-up grin, flexing.`
17. **`brann-allout.png`**
    `Larger 192x192 full-body action pose: mid-leap toward the right, axe raised high in both hands about to crash down, a huge white smear arc, speed lines.`
18. **`brann-finisher.png`**
    `Larger 192x192 heroic finishing pose, front view: axe slammed into the cracked ground, leaning on it, rubble around, a triumphant smirk, a blue rim light.`

---

## Sela (ice and lightning caster)

### Prompt 0: lock the style and design
```
You are making pixel art sprites for an HD-2D style JRPG battle (original game, Octopath-like mood).
Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no text, no watermark.
- 1-pixel dark outline (#16132a), light from the upper left.
- Flat solid magenta #FF00FF background, nothing else behind the character.
- Keep the character EXACTLY as in the attached reference: same design, colors, proportions.

Character: Sela, a calm ice and lightning caster, chibi proportions. Very long straight navy hair down to her waist
with a small cyan ribbon tied in it, pale skin, blue eyes. Pale lavender-white robe with cyan trim, dark boots.
A glowing cyan ice crystal floats beside her right hand.
Palette: hair #2b2f5e, skin #f6d8bf, robe #e6e2f0, robe shadow #b3adc9, trim #7fd8ff, boots #2a2640,
crystal #7fd8ff, eyes #1f3a6a.
Reply "ready" and wait for the next prompt.
```

### Battle animations (back view)
1. **`sela-back-idle.png`**
   `Back view, idle, 4 frames: calm breathing loop, the long hair sways gently, the crystal slowly orbits around her hand.`
2. **`sela-back-attack.png`**
   `Back view, basic attack, 6 frames: draw the crystal back, step forward, flick the crystal out like a striking dart with a cyan smear, it returns to her hand, recover.`
3. **`sela-back-cast-ice.png`**
   `Back view, ice spell "Frost", 5 frames: raise both hands, a pale blue magic circle forms on the ground, the crystal splits into three ice shards, the shards fly forward, settle.`
4. **`sela-back-cast-volt.png`**
   `Back view, lightning spell "Volt", 5 frames: her hair lifts and crackles with yellow electricity, she points forward, a jagged lightning bolt fires from her hand, the static fades.`
5. **`sela-back-hurt.png`**
   `Back view, taking a hit, 3 frames: knocked back with her hair whipping, cover her face, recover.`
6. **`sela-back-parry.png`**
   `Back view, perfect parry, 3 frames: thrust the crystal forward as a small hexagonal ice shield, a bright white spark at impact, counter-ready.`
7. **`sela-back-dodge.png`**
   `Back view, dodge, 3 frames: graceful sidestep to the left with the hair and robe flowing, land lightly.`
8. **`sela-back-down.png`**
   `Back view, knocked down, 2 frames looping: kneeling with one hand on the ground, dazed, the crystal dim and drooping.`
9. **`sela-back-ko.png`**
   `Back view, knocked out, 4 frames: sway, sink to her knees, fold forward, the crystal falls and dims.`
10. **`sela-back-victory.png`**
    `Back view, victory, 4 frames: twirl on the spot with the hair fanning out, raise the crystal high as it sparkles.`

### Front view
11. **`sela-front-idle.png`**
    `Front view facing the viewer, idle, 4 frames: calm breathing loop, serene half-smile, the crystal orbiting.`
12. **`sela-front-victory.png`**
    `Front view facing the viewer, victory, 4 frames: hold the crystal to her chest, gentle smile, ice sparkles around her.`

### Cut-in art
13. **`sela-portrait.png`**
    `Larger 128x128 head-and-shoulders portrait, facing 3/4 toward the viewer, calm composed expression, ribbon visible, a cool cyan rim light from the crystal.`
14. **`sela-eyes.png`**
    `A wide 256x64 close-up strip of only Sela's eyes, cool piercing gaze, blue eyes with a cyan electric glint, a few strands of hair across.`
15. **`sela-baton-throw.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: gracefully tossing a glowing brass lantern to someone off to the right, a small smile, hair flowing.`
16. **`sela-baton-catch.png`**
    `Larger 160x160 dynamic pose, front 3/4 view: catching a glowing brass lantern in both hands at her chest, surprised then happy, sparkles.`
17. **`sela-allout.png`**
    `Larger 192x192 full-body action pose: gliding toward the right, three ice shards and crackling lightning orbiting her, hair streaming, speed lines.`
18. **`sela-finisher.png`**
    `Larger 192x192 heroic finishing pose, front view: the crystal held high blazing cyan, lightning arcing around her, hair and robe swept up by the energy, a calm smile.`

---

## Order to make them in

Generate these first; they're the most visible:
1. Every hero's **back idle**, **back attack** and **back cast** (Lumen cast, Brann skill or slam, Sela cast-ice)
2. The **portraits**
3. The **Baton Pass** throw and catch, then the **All-Out** and **finisher** poses
4. The rest (hurt, parry, dodge, down, KO, victory, front views)

Missing files are fine: the game falls back to the current single-drawing poses for anything that doesn't exist yet.

---

# Round 2: missing sprites, enemies, boss and environment

Same workflow: one Gemini chat per character, paste its Prompt 0 with the reference image attached, then send the
numbered prompts one at a time. Save each result in `assets/sprites/` under the file name shown (`.png` or `.jpg`,
either works). Enemies face the player's party, so their animations are **front view**.

## Sela: the one missing hero strip

Open Sela's chat again (or start one with her Prompt 0 above), then:

1. **`sela-front-victory.png`**
   `Front view facing the viewer, victory, 4 frames: hold the crystal to her chest, gentle smile, ice sparkles around her, hair lifting slightly. Same size and baseline as her front idle.`

## Enemy rules block

Paste this at the start of each enemy chat, followed by that enemy's character block.
```
You are making pixel art sprites for an HD-2D style JRPG battle (original game, Octopath-like mood).
Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no text, no watermark.
- 1-pixel dark outline, light from the upper left.
- Flat solid magenta #FF00FF background, nothing else behind the character.
- Every animation is ONE horizontal row, frames left to right in time order, each frame a 64x64 cell,
  the character the same size with its feet (or lowest point) on the same baseline in every frame.
- Keep the character EXACTLY as in the attached reference: same design, colors, proportions.
```

## Mire Wisp (enemy)

Attach `assets/sprites/wisp.jpg`, paste the rules block, then:
```
Character: the Mire Wisp, a small floating ghost-flame spirit. Pale teal-green glowing body shaped like a
teardrop flame with a wispy tail instead of legs, two dark hollow eyes, a brighter glowing core in its chest.
Palette: body #9fffd9, body shadow #4fbf9a, core #e8fff6, eyes #10302a.
Reply "ready" and wait for the next prompt.
```
1. **`wisp-front-idle.png`**
   `Front view, idle, 4 frames: bobbing float loop, the flame tip flickers, the core pulses.`
2. **`wisp-front-attack.png`**
   `Front view, attack, 5 frames: shrink and gather light, the core flares, lunge forward, an electric yellow spark bursts from it, drift back.`
3. **`wisp-front-hurt.png`**
   `Front view, taking a hit, 3 frames: flattens and flickers to white, wobbles, reforms.`
4. **`wisp-front-down.png`**
   `Front view, knocked down, 2 frames looping: drooping low to the ground, flame dim, little dizzy swirls above it.`
5. **`wisp-front-ko.png`**
   `Front view, knocked out, 4 frames: the flame gutters, breaks apart into motes, the motes fade, only a faint wisp remains.`

## Rust Knight (enemy)

Attach `assets/sprites/knight.jpg`, paste the rules block, then:
```
Character: the Rust Knight, a hulking suit of corroded plate armor with nobody inside. Rust-brown and dull iron
plates, a closed helm with a red plume and two glowing red eye slits, a chipped longsword in the right hand and a
dented round shield in the left.
Palette: armor #7a6a5e, rust #9a4e2a, iron shadow #3e3540, plume #c0392b, eyes #ff4a3a, shield rim #b08a4a.
Reply "ready" and wait for the next prompt.
```
1. **`knight-front-idle.png`**
   `Front view, idle, 4 frames: heavy breathing loop, armor plates shift, eye slits glow on and off.`
2. **`knight-front-attack.png`**
   `Front view, attack, 6 frames: raise the sword high, step in, chop downward with a white motion smear, sparks off the blade, pull back, return to stance.`
3. **`knight-front-hurt.png`**
   `Front view, taking a hit, 3 frames: rocks backward behind the shield, rust flakes fall off, recover.`
4. **`knight-front-down.png`**
   `Front view, knocked down, 2 frames looping: down on one knee leaning on the sword, helm drooping, dizzy swirls.`
5. **`knight-front-ko.png`**
   `Front view, knocked out, 4 frames: stagger, the helm topples off, the empty armor collapses into a pile of plates, the plume falls last.`

## Ash Hound (enemy)

Attach `assets/sprites/hound.jpg`, paste the rules block, then:
```
Character: the Ash Hound, a lean black wolf-like beast made of charred ash. Cracks of glowing orange ember across
its body, a glowing ember rune on its chest, orange eyes, a tail that ends in a small flame. Four legs.
Palette: body #1e1a1c, body light #3a3236, ember #ff7a2c, ember bright #ffb347, eyes #ffb347.
Reply "ready" and wait for the next prompt.
```
1. **`hound-front-idle.png`**
   `Front view, idle, 4 frames: low growling loop, shoulders rise and fall, ember cracks pulse, tail flame flickers.`
2. **`hound-front-attack.png`**
   `Front view, attack, 6 frames: crouch low, pounce forward with jaws open, a bite with an orange fire smear, land, shake, back to stance.`
3. **`hound-front-hurt.png`**
   `Front view, taking a hit, 3 frames: yelp and flinch sideways, ash puffs off, recover.`
4. **`hound-front-down.png`**
   `Front view, knocked down, 2 frames looping: lying on its belly, head down, embers dim, dizzy swirls.`
5. **`hound-front-ko.png`**
   `Front view, knocked out, 4 frames: collapse on its side, the embers go dark, the body crumbles into a pile of ash with one last spark.`

## Lantern Warden (boss)

The boss currently borrows the Rust Knight's art; this gives it its own design. The cells are bigger (128x128)
because it stands about twice the heroes' height. There is no reference image to attach: it is new.
```
You are making pixel art sprites for an HD-2D style JRPG battle (original game, Octopath-like mood).
Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no gradients, no text, no watermark.
- 1-pixel dark outline, light from the upper left.
- Flat solid magenta #FF00FF background, nothing else behind the character.
- Every animation is ONE horizontal row, frames left to right in time order, each frame a 128x128 cell,
  the character the same size with its feet on the same baseline in every frame.

Character: the Lantern Warden, the final boss: a towering armored guardian of the ruins. Tall dark iron armor with
gold trim, a tattered navy cloak, a horned helm whose visor glows orange from inside. In its right hand a long
halberd; from its left hand hangs a huge brass lantern on a chain, burning with orange fire. Imposing, broad
shoulders, slightly hunched, about twice as tall as a human hero.
Palette: iron #2e2a38, iron light #57506a, gold trim #d9a441, cloak #23305a, cloak shadow #151c38,
fire #ff9a3c, fire core #fff0b0, visor glow #ffb347.
Reply "ready" and wait for the next prompt.
```
1. **`warden.png`** (the base sheet)
   `A turnaround sheet: ONE row of 3 cells, each 128x128: front view facing the viewer, side view facing RIGHT, back view. Neutral standing pose, halberd upright, lantern hanging.`
2. **`warden-front-idle.png`**
   `Front view, idle, 4 frames: slow heavy breathing, the cloak sways, the lantern swings slightly on its chain, the fire flickers.`
3. **`warden-front-attack.png`**
   `Front view, attack, 6 frames: raise the halberd overhead, the lantern flares, step in, a sweeping slash with an orange fire smear, the follow-through, back to stance.`
4. **`warden-front-hurt.png`**
   `Front view, taking a hit, 3 frames: staggers back a step, the lantern swings wildly, recovers.`
5. **`warden-front-down.png`**
   `Front view, knocked down, 2 frames looping: down on one knee, halberd planted, lantern on the ground dimmed, dizzy swirls.`
6. **`warden-front-ko.png`**
   `Front view, knocked out, 5 frames: the visor glow fades, it drops to both knees, the lantern goes out, it topples forward, the armor lies still.`
7. **`warden-front-rage.png`**
   `Front view, enraged, 4 frames: throws its head back, the lantern bursts into a pillar of fire, the visor blazes, flames wreath the armor. Played when it drops to half HP.`
8. **`warden-portrait.png`**
   `Larger 192x192 head-and-shoulders portrait, menacing low angle, visor blazing orange, lantern fire lighting the helm from below.`

## Environment

These are textures for the 3D arena, not sprites: **no magenta background**; they fill the whole image. Use a fresh
chat and paste this first:
```
You are making pixel art textures for an HD-2D style JRPG battle arena (original game, Octopath-like mood): ruins at
night lit by torches. Rules for every image in this chat:
- True pixel art: crisp hard-edged square pixels, no anti-aliasing, no blur, no text, no watermark.
- Fill the whole image edge to edge. No characters, no UI.
- Palette: cool night purples and blue-greys, warm orange torchlight accents, muted moss greens.
Reply "ready" and wait for the next prompt.
```

### Arena 1: the ruins (fights 1 and 2)
1. **`env-ruins-floor.png`**
   `A seamless tiling floor texture, 256x256, viewed straight down: worn square flagstones with cracks, moss in the gaps, a few scattered pebbles. The left edge must match the right edge and the top must match the bottom.`
2. **`env-ruins-wall.png`**
   `A seamless tiling wall texture, 256x256, viewed straight on: old stacked stone blocks, chipped corners, moss creeping up from the bottom. Edges must tile seamlessly in both directions.`
3. **`env-ruins-sky.png`**
   `A wide night-sky backdrop, 720x320: deep purple to dark blue sky in pixel-art color bands, scattered stars, a pale moon on the upper left, distant silhouettes of broken towers and trees along the bottom.`

### Arena 2: the Warden's sanctum (the boss fight)
4. **`env-sanctum-floor.png`**
   `A seamless tiling floor texture, 256x256, viewed straight down: dark polished stone tiles with thin gold inlay lines forming a circular ritual pattern, a faint orange glow in the inlay. Edges tile seamlessly.`
5. **`env-sanctum-wall.png`**
   `A seamless tiling wall texture, 256x256, viewed straight on: dark carved stone with gold-trimmed pillars in relief and small hanging brass lanterns glowing orange. Edges tile seamlessly.`
6. **`env-sanctum-sky.png`**
   `A wide backdrop, 720x320: the inside of a vast vaulted hall at night, a huge stained-glass window in the center glowing orange and violet, chains with giant lanterns hanging from the darkness above.`

## Round 2: order to make them in
1. The **Warden's base sheet** and **idle**, so the boss stops borrowing the knight's art
2. The **enemy idle and hurt** strips, which are on screen the most
3. **Sela's front victory**
4. The **sanctum** set, so the boss fight gets its own arena
5. Everything else
