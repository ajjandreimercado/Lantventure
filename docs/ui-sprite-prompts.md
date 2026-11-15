# UI sprite rework (HD-2D, free via Gemini)

**The problem:** the menus, cards and boss bar are flat CSS boxes with 9×9 pixel icons. HD-2D games frame their
UI with ornate panels, metal trim and painted icons. This doc makes those pieces. Claude then cuts out the
magenta and wires them into `style.css` and `src/hud.js`.

## Fonts: don't generate these

AI image tools can't make a usable font. You'd get a picture of letters, not something the game can type with.
Use a real free font instead. The game already loads two from Google Fonts: **Pixelify Sans** (body text)
and **Jersey 10** (names, banners). Both are generic.

Better fits for HD-2D, all free on Google Fonts:

| Role | Pick | Why |
|---|---|---|
| Titles, names, banners | **Cinzel** | Carved Roman capitals, the classic HD-2D menu look. Not pixelated, which is normal for HD-2D UI. |
| Titles (pixel option) | **Jacquard 12** | Gothic blackletter in pixels. Very dark fantasy, but harder to read. |
| Body text, numbers | Keep **Pixelify Sans**, or **Silkscreen** for tiny labels | Crisp at small sizes. |

Switching is a two-line change in `index.html` and `style.css`. Ask Claude to do it.

## 0. Setup message (first message of a new chat)

Click **+** and attach `docs/battle.jpg` (the current game) and `assets/sprites/warden.jpg` (the style
target) **before** sending.

```
You are my UI artist for a turn-based JRPG battle game in the HD-2D style (pixel-art sprites in a lit 3D diorama). Image 1 is the current game: its UI is plain and flat. Image 2 is the art style target.

STYLE RULES (apply to every image in this chat)
- HD-2D pixel-art UI, dark fantasy: dark navy-purple panels (#0e0a1a to #1c1430), aged gold metal trim (#c9a24a highlights, #6b4f1e shadows), small lantern and flame motifs.
- Crisp single pixels, no blur, no anti-aliasing, no smooth gradients, about 16 colors.
- NO text, NO letters, NO numbers on anything. The game adds the text itself.
- Background is solid flat magenta (#FF00FF) filling the whole canvas. No shadows on the background, no borders around the image.
- Every piece sits alone with a wide magenta gap around it. Pieces never touch.

HOW I'LL USE THE IMAGES
- PANELS are stretched by the game: the 4 corners stay as they are, the edges repeat, the middle stretches. So corners can be ornate, but the straight edges must be plain and uniform, and the center must be one flat color.
- ICONS are shown small (about 24 px), so they must read clearly as a silhouette.

I'll ask for one sheet per message. If I say "redo", fix only what I point out.

Reply "Ready" and describe the UI style you'll use in one sentence. Don't generate anything yet.
```

## 1. Panels and buttons (aspect ratio 16:9)

Save as `assets/ui/<file>`.

| File | Prompt |
|---|---|
| panel.png | One empty rectangular UI panel, wider than tall: dark navy center, aged gold frame 3 pixels thick, small ornate gold corner pieces with a tiny gem. Plain straight edges between the corners. |
| button-states.png | One row of 4 empty command-menu buttons, same size, wide and short: (1) normal, dark with a thin gold edge; (2) selected, brighter gold edge with a warm glow and a small flame on the left end; (3) disabled, gray desaturated; (4) special, crimson with a bright gold edge. Plain straight edges. |
| card-frame.png | One empty party-member status frame, wider than tall, with a round medallion socket on the left end for a portrait, gold trim, dark center. |
| boss-frame.png | One long, thin, empty boss health-bar frame: dark iron with gold trim, horned skull ornament on the left end, a lantern ornament on the right end. Empty inside. |
| banner.png | One long empty ribbon banner for big announcements, dark crimson cloth with gold edges, folded ends. |

## 2. Icons (aspect ratio 16:9, one sheet)

Save as `assets/ui/icons.png`. If 12 at once comes out messy, split it into two sheets of 6.

```
Make an icon sheet: 12 game icons in a grid of 2 rows × 6 columns, all the same size, each centered in its own cell with a wide magenta gap. In order:
Row 1: crossed sword (attack), crosshair (aim), flame (fire), snowflake crystal (ice), lightning bolt (electric), swirling gust (wind).
Row 2: glowing green cross (heal), lantern being tossed (baton pass), burst star (all-out attack), horned skull (boss), gold checkmark (cleared), downward gold arrow (current turn).
Each icon: thick dark outline, bold readable silhouette, element colors (fire orange, ice cyan, electric yellow, wind green, heal soft green, the rest gold).
```

## 3. Small parts (aspect ratio 16:9, one sheet)

Save as `assets/ui/parts.png`.

```
Make a sheet of small UI parts, each alone with a wide magenta gap, in one row:
(1) an AP gem, full, glowing gold diamond; (2) the same AP gem, empty, dark socket; (3) a pointing-hand cursor in a gold gauntlet; (4) a short horizontal ornamental gold divider; (5) an empty HP bar frame, long and thin, gold trim.
```

## When the files are in

Tell Claude they're in `assets/ui/`. Claude turns the magenta transparent, uses the panels as stretchable
borders (CSS `border-image`), and swaps the 9×9 icons in `src/hud.js` for the new icon sheet.
