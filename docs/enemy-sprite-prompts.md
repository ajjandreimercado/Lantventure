# Enemy sprite rework (HD-2D, free via Gemini)

**The problem:** the Rust Knight, Mire Wisp and Ash Hound are drawn chibi or low-detail, and they have only one
base sheet, so their attack/hurt/down/KO poses are faked by squashing one drawing. The Warden has real strips
(`warden-front-*.png`). Redraw these three in HD-2D and give them real strips too.

Enemies face the party, so they only need **front-view** strips.

**Order:** one enemy per Gemini chat: setup message, base sheet, check it in the game, then the strips.

## 0. Setup message (first message of each new chat)

Click **+** and attach two images **before** sending:
1. `assets/sprites/warden.jpg` (style target)
2. The enemy's old sheet: `knight.jpg`, `wisp.jpg` or `hound.jpg`

```
You are my pixel artist for a turn-based JRPG battle game in the HD-2D style: detailed pixel-art sprites standing in a lit 3D diorama, like a modern 2D-sprite-in-3D JRPG.

ATTACHED IMAGES
- Image 1 (armored knight with a lantern) is the STYLE TARGET. Match its level of detail, shading and pixel size.
- Image 2 is the OLD version of the enemy I want redrawn. Keep its design (shape, colors, features, weapon) but NOT its chibi, low-detail style.

STYLE RULES (apply to every image you make in this chat)
- HD-2D pixel art, detailed and menacing, dark fantasy. Humanoids get realistic proportions, never chibi.
- Crisp single pixels, no blur, no anti-aliasing, no smooth gradients, about 24 colors.
- Soft light from the upper left with a warm rim light. Thin dark outline.
- Every image uses the SAME pixel size as the style target.
- Background is solid flat magenta (#FF00FF) filling the whole canvas. No ground shadow, no text, no labels, no borders, no grid lines between frames.

HOW I'LL USE THE IMAGES
My game cuts the magenta out and slices each image into frames automatically, so:
- When I ask for N frames, draw exactly N poses in ONE horizontal row, evenly spaced, all the same scale, on the same ground line, with magenta gaps between poses so they never touch.
- "Front view" means facing the viewer, because the enemy faces the player's party.

WORKFLOW
1. First, I'll ask for a BASE SHEET: one row of 3 poses at the same scale: front view, side view facing right, back view.
2. After I approve it, that base sheet becomes the reference for every animation strip I ask for. The enemy must look identical to it in every strip.
3. I'll ask for one strip per message. If I say "redo", keep the same enemy and fix only what I point out.

Reply "Ready" and describe in one sentence how you'll redraw the enemy from Image 2. Don't generate anything yet.
```

## 1. Base sheet (aspect ratio 16:9)

Save as `assets/sprites/<id>.png`.

| Enemy | Prompt |
|---|---|
| Rust Knight (`knight`) | Make the base sheet: a hulking knight in battered, rust-stained steel plate armor, a closed helm with a glowing red visor slit and a red plume, a tattered brown cape, a notched longsword in the right hand and a round rusted shield in the left. Menacing stance. One row of 3 poses at the same scale: front view, side view facing right, back view. |
| Mire Wisp (`wisp`) | Make the base sheet: an eerie floating marsh spirit made of translucent teal ghost-flame, a flickering flame crest on its head, hollow dark eyes, a bright glowing core in its chest, its body trailing into a wispy tail, no legs. Hovering above the ground. One row of 3 poses at the same scale: front view, side view facing right, back view. |
| Ash Hound (`hound`) | Make the base sheet: a lean, black, wolf-sized hound with glowing orange lava cracks across its body, a burning molten core in its chest, a flame-tipped tail and fierce yellow eyes. Snarling, crouched to pounce. One row of 3 poses at the same scale: front view, side view facing right, back view. |

If it's good, reply: *"Approved. Use this exact sheet as the reference from now on."*

## 2. Animation strips (front view)

Start each message with: *"Strip, N frames, front view, same enemy as the approved sheet:"*, then the prompt.

**Aspect ratio:** 2–3 frames → **16:9**. 4–5 frames → **the widest available** (21:9 if offered, otherwise 16:9).

### Rust Knight

| File | N | Prompt |
|---|---|---|
| knight-front-attack.png | 4 | Ready stance, sword raised high, overhead slash with a motion smear, follow-through low. |
| knight-front-hurt.png | 3 | Flinch backward, shield knocked aside, recover. |
| knight-front-down.png | 2 | Dropping to one knee, slumped on one knee, dazed. |
| knight-front-ko.png | 5 | Staggers, drops the sword, falls to his knees, collapses forward, empty armor lying flat. |

### Mire Wisp

| File | N | Prompt |
|---|---|---|
| wisp-front-attack.png | 4 | Gathers into a tight glow, flares bright, lashes forward with a spark trail, settles. |
| wisp-front-hurt.png | 3 | Flickers from a hit: stretched and distorted, dim, reforming. |
| wisp-front-down.png | 2 | Sinks low and dims, drooping near the ground. |
| wisp-front-ko.png | 5 | Wavers, cracks of light, bursts into motes, fading motes, almost gone. |

### Ash Hound

| File | N | Prompt |
|---|---|---|
| hound-front-attack.png | 4 | Crouch, leap toward the viewer with jaws open, snapping bite with ember sparks, land. |
| hound-front-hurt.png | 3 | Head snapped aside with a yelp, flinch, recover. |
| hound-front-down.png | 2 | Legs buckling, lying on its side, dazed. |
| hound-front-ko.png | 5 | Staggers, legs give out, collapses, lava cracks fading, still and dark. |

## When the files are in

Tell Claude which enemy is done. Its `sheet` in `src/data.js` changes to `rows: 1, cols: 3` with `sameScale:
true`, and it gets an `anims.front` block like the Warden's. Its `h` may need a bump so it stays the right
size next to the taller heroes.
