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
