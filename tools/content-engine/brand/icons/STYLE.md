# Icon style

The house style for FIT50 content icons. Read this before
generating, recolouring, or approving any icon. A slightly-off
style is obvious next to the originals.

## The nine originals

| id | subject |
|---|---|
| `chill-out` | ice cubes |
| `crispy-clarity` | ice / cold shower water |
| `feed-brain` | book stack |
| `fresh-lungs` | lungs |
| `fuel-right` | fuel pump |
| `move-body` | runner |
| `open-mind` | brain |
| `step-it-up` | feet |
| `wet-lips` | lips with straw |

These are the source of truth for the visual language. A new
icon is approved only if it sits next to these and doesn't
stand out.

## The rules

- **Black ink on white.** No colour, no grey fills. The
  renderer recolours at draw time based on the slide's
  ground (ink on paper / lavender / white; paper on ink /
  teal), but the SVG itself ships monochrome.
- **A thick, slightly wobbly outer contour**, with thinner
  lines inside. The wobbly line is the signature; a clean
  vector line looks "off" next to the originals.
- **Shading by sparse hatching strokes**, never solid
  shadow. Diagonal hatches at roughly 45° that follow the
  form. Density varies — never uniform.
- **One subject, centred on a square canvas, no text.**
  Padding around the subject so the icon "breathes" inside
  the frame.
- **Occasional energy marks** around the subject (sparkles,
  motion lines, snowflakes) and, sometimes, an enclosing
  circle. The originals vary on this — match the closest
  existing icon for consistency.
- **No emoji, no icons from a stock library.** They don't
  match. The whole point of the engine is the line.

## Generation prompt template

When asking an image model to fill a gap, use this template
unchanged except for `{subject}`:

> `{subject}`, single object, hand-drawn black ink line
> illustration, thick wobbly outline, thinner inner lines,
> sparse hatching for shading, white background, centred,
> no text, no colour.

## Approval

New icons enter the library only after:

1. **Automated checks** — threshold to pure black on
   transparent, crop to subject, pad to the same share of
   the square as the originals, check line weight against
   the library average. Code rejects anything that
   doesn't match.
2. **By-eye check** — you (Barny) approve the survivors
   one tap at a time, opening the candidate next to the
   closest existing icon and judging whether it would
   stand out in a 9-cell grid.

Until both pass, the icon sits in `candidates/` with
`approval_status: "pending"`. The renderer never uses a
pending icon.

## Recolouring at render time

The renderer reads the SVG and re-fills the path with the
appropriate colour for the slide's ground:

- `paper`, `lavender`, `white`, `cream` grounds → icon
  in `ink`
- `ink`, `teal` grounds → icon in `paper`

This is a template setting, not a new image. The same SVG
serves every ground.

## Minimum size

Keep icons at least 140px on the 1080px canvas. That roughly
matches the web design system's 48px minimum once Instagram
scales the image to a phone screen. Below that, the line
weight disappears and the icon looks flat.
