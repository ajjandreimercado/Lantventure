# Hero sprite rework (HD-2D, free via Gemini)

**The problem:** the heroes are chibi (about 3 heads tall), and each is drawn at a different pixel size. The
Lantern Warden is already close to HD-2D, so the heroes get redrawn to match him.

**Order:** one hero per Gemini chat. Do the setup message, then the base sheet, check it in the game, then the
strips, then the cut-ins.

## 0. Setup message (first message of each new chat)

Click **+** and attach two images **before** sending:
1. `assets/sprites/warden.jpg` (style target)
2. The hero's old sheet: `lumen.jpg`, `brann.jpg` or `sela.jpg`

```
You are my pixel artist for a turn-based JRPG battle game in the HD-2D style: detailed pixel-art sprites standing in a lit 3D diorama, like a modern 2D-sprite-in-3D JRPG.

ATTACHED IMAGES
- Image 1 (armored knight with a lantern) is the STYLE TARGET. Match its level of detail, proportions, shading and pixel size.
- Image 2 is the OLD version of the character I want redrawn. Keep their design (hair, outfit, colors, weapon) but NOT its chibi style.

STYLE RULES (apply to every image you make in this chat)
- HD-2D pixel art. Realistic proportions, about 6 heads tall, never chibi.
- Crisp single pixels, no blur, no anti-aliasing, no smooth gradients, about 24 colors.
- Soft light from the upper left with a warm rim light. Thin dark outline.
- Every image uses the SAME pixel size as the style target.
- Background is solid flat magenta (#FF00FF) filling the whole canvas. No ground shadow, no text, no labels, no borders, no grid lines between frames.

HOW I'LL USE THE IMAGES
My game cuts the magenta out and slices each image into frames automatically, so:
- When I ask for N frames, draw exactly N poses in ONE horizontal row, evenly spaced, all the same scale, feet on the same ground line, with magenta gaps between poses so they never touch.
- "Back view" means seen from behind over the shoulder, facing away from the viewer, because the battle camera sits behind the party.
- The weapon stays in the same hand in every frame.

WORKFLOW
1. First, I'll ask for a BASE SHEET: one row of 3 poses at the same scale: front view, side view facing right, back view.
2. After I approve it, that base sheet becomes the reference for every animation strip I ask for. The character must look identical to it in every strip.
3. I'll ask for one strip per message. If I say "redo", keep the same character and fix only what I point out.

Reply "Ready" and describe in one sentence how you'll redraw the character from Image 2. Don't generate anything yet.
```

## 1. Base sheet (aspect ratio 16:9)

Save as `assets/sprites/<id>.png`.

| Hero | Prompt |
|---|---|
| Lumen | Make the base sheet: a young fire mage with messy silver-white hair, violet eyes, a crimson hooded coat with gold trim over dark clothes, holding a wooden staff topped with a glowing amber crystal in his right hand. Battle-ready stance. One row of 3 poses at the same scale: front view, side view facing right, back view. |
| Brann | Make the base sheet: a broad, muscular axe warrior with spiky brown hair and stubble, a steel-blue sleeveless tunic, leather belt and bracers, gripping a large double-bladed battle axe in both hands at his side (never slung on his back). Battle-ready stance. One row of 3 poses at the same scale: front view, side view facing right, back view. |
| Sela | Make the base sheet: a calm ice and lightning mage with very long dark navy hair and a glowing cyan ribbon, a pale lavender robe with cyan trim, a floating cyan crystal hovering beside her right shoulder. Battle-ready stance. One row of 3 poses at the same scale: front view, side view facing right, back view. |

If it's good, reply: *"Approved. Use this exact sheet as the reference from now on."*

## 2. Animation strips

Start each message with: *"Strip, N frames, same character as the approved sheet:"*, then the prompt.
Save as the filename shown (`<id>` = `lumen`, `brann` or `sela`).

**Aspect ratio:** 2–3 frames → **16:9**. 4–5 frames → **the widest available** (21:9 if offered, otherwise 16:9).

### All three heroes

| File | N | Prompt |
|---|---|---|
| `<id>-back-idle.png` | 4 | Back view, battle idle: slow breathing, slight sway, hair and cloth moving. |
| `<id>-back-attack.png` | 4 | Back view, basic weapon attack: wind-up, swing with a motion smear, impact, recover. |
| `<id>-back-hurt.png` | 3 | Back view, hit: recoil backward, flinch, recover. |
| `<id>-back-down.png` | 2 | Back view, knocked down: dropping to one knee, slumped on one knee. |
| `<id>-back-ko.png` | 4 | Back view, defeated: stagger, knees buckle, fall, lying on the ground. |
| `<id>-back-victory.png` | 4 | Back view, victory: relax, turn slightly, raise weapon, hold the pose. |
| `<id>-front-idle.png` | 4 | Front view, battle idle: slow breathing, slight sway. |
| `<id>-front-victory.png` | 4 | Front view, victory: confident pose with a weapon flourish. |

### Per hero

| File | N | Prompt |
|---|---|---|
| lumen-back-cast.png | 4 | Back view, casting fire: raise the staff, crystal flares, flame swirls, release. |
| lumen-back-parry.png | 4 | Back view, parry: staff brought up across the body, block with a spark, push away, reset. |
| lumen-back-dodge.png | 4 | Back view, dodge: quick sidestep left, low crouch, slide, recover. |
| brann-back-skill.png | 4 | Back view, Gale Cleave: spin wind-up, wide horizontal axe sweep trailing wind, follow-through, reset. |
| brann-back-slam.png | 5 | Back view, Shatter: axe raised overhead, leap, smash down, ground cracks, rise. |
| brann-back-parry.png | 5 | Back view, parry: axe haft raised to block, impact spark, brace, shove, reset. |
| brann-back-dodge.png | 3 | Back view, dodge: heavy sidestep, crouch, recover. |
| sela-back-cast-ice.png | 4 | Back view, casting ice: crystal glows cyan, frost gathers in her hands, thrust forward, ice shards release. |
| sela-back-cast-volt.png | 4 | Back view, casting lightning: raise hand, crackling arcs, crystal flashes, bolt released forward. |
| sela-back-parry.png | 3 | Back view, parry: crystal barrier flares in front of her, impact, fades. |
| sela-back-dodge.png | 3 | Back view, dodge: light sidestep with flowing hair and robe, recover. |

## 3. Cut-ins (single images, keep the magenta background)

Start each message with: *"Single image, same character as the approved sheet:"*

| File | Aspect ratio | Prompt |
|---|---|---|
| `<id>-portrait.png` | 1:1 | HD-2D pixel art bust portrait, three-quarter view, determined expression. |
| `<id>-eyes.png` | Widest | A very wide, short strip showing only the eyes, intense, dramatic lighting. |
| `<id>-baton-throw.png` | 1:1 | Upper body, tossing a glowing lantern to the side. |
| `<id>-baton-catch.png` | 1:1 | Upper body, catching a glowing lantern, confident. |
| `<id>-allout.png` | 3:4 | Full body, dynamic leaping attack pose. |
| `<id>-finisher.png` | 3:4 | Full body, dramatic finishing pose with the weapon, seen over the shoulder. |

## When the files are in

Tell Claude which hero is done. Their `sheet` in `src/data.js` changes to `rows: 1, cols: 3` with `sameScale:
true` like the Warden's, the filenames move from `.jpg` to `.png`, and `h` goes up from 34 to about 48 so the
taller heroes stand next to the Warden (h 64) at the right size.
