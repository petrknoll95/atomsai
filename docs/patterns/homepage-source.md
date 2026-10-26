# Homepage pattern applications

The seven decorative pattern applications in [homepage frame185:3428](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=185-3428) were re-inspected through the original Figma Plugin API. [homepage-source.json](./homepage-source.json) contains their source IDs, full-precision Display P3 colors, explicit/inherited modes, component overrides, transforms, clipping, frame hierarchy, mask geometry, and gradient comparisons. No Figma changes were made.

| Application | Source node | Family / count | Instance → parent crop | Color source |
| --- | --- | --- | --- | --- |
| offerings-drift | `186:4156` | Drift / 5 | 480.003357×553 at(0,0) → 480×553, radius16 | Forest Dark `5:2` |
| offerings-concentric | `186:4172` | Concentric / 15 | 553² at(−36.667969,0) → 480×553, radius16 | Forest Dark `5:2` |
| offerings-band | `186:4188` | Single band / 5 | 480.003296×553 at(0,0) → 480×553, radius16 | Forest Dark `5:2` |
| applications-concentric | `I260:7420;260:7305` | Legacy Concentric / 15 | 352.000061² at(−0.000061,−0.000061) → 352² circle | Original unbound iris solids |
| preview-drift | `273:11359` | Drift / **1** | 992×640 at(0,0) → 992×640, radius32 | Forest Dark `5:2` |
| preview-concentric | `215:15653` | Legacy Concentric / 15 | 800² at(−160,−80) → 480×640, radius32 | Original explicit iris fill overrides |
| cta-pattern | `198:8191` | Offset / 20 | 720² rotated−90°, translation(0,544) → 720×368, radius16 | Explicit Iris Light `5:5` |

Values in the table are rounded for readability; JSON retains the exact source floats and the six-element transforms.

The original homepage **stretches** Drift and Single band to their nonsquare destinations. This differs from component descriptions that advise uniform scaling/cropping, and is preserved as a homepage-specific choice. The voice preview uses one full-width slit with exactly the published Drift paint profile; it is a measured detached source variant, not a guessed density.

All principal fields are approximately105% of their instance viewport, offset−2.5%. Raw geometry is retained rather than silently rounded: voice's field x is−24.80078125px rather than ideal−24.8px. Concentric's separate reflection mask and color carrier extend farther, as recorded in the frame and mask data.

## Blur and legacy composition

Offerings Drift and Single band retain **1.8899998664855957px** blur at480×553; resizing their instances did not scale the original effects. Voice uses **2.343599796295166px** blur at992×640. Concentric and Offset have no layer blur. JSON includes both measured radii and the independent x/y inverse scaling needed when rendering the same blur in a canonical800×800 coordinate space.

Both legacy Concentric applications come from master`205:12049`. Its child is misleadingly named “Offset — editable masks”; its measured geometry is the15-ring Concentric design. Their palettes are identical:

| Role | Raw source Display P3 RGB | Source paint behavior |
| --- | --- | --- |
| Base and reflection-base | [0.2862745225429535,0.24705882370471954,0.3450980484485626] | Opaque iris shade |
| Upper/lower field and reflection | [0.5490196347236633,0.47058823704719543,0.6901960968971252] | Opaque iris |
| Highlight | [0.8470588326454163,0.8039215803146362,0.8980392217636108] | Opaque iris tint |

The legacy reflection parent is **LINEAR_DODGE** and has the nonblack, opaque reflection-base paint above. Its carrier is NORMAL, filtered by the original ALPHA annulus mask. The parent background therefore participates in additive composition; treating it as the modern Forest theme's black additive identity loses a material part of the source appearance.

CTA uses iris, **not iris shade**, for its base, upper field and highlight; its lower field is iris mist and its reflection is white. These values are resolved from Iris Light bindings, not inferred from the purple export.

## Verification and coverage

- Offerings Drift, Concentric, Single band and CTA gradient matrices/stops are byte-for-byte identical to their respective source variants.
- Voice's seven paints are byte-for-byte identical to published Drift paints.
- Every one of105 legacy Concentric gradient paints was compared against modern density1. Maximum matrix, stop-position and RGBA differences are each5.960464477539063e−8. Mask types, ring counts, backing fills, effects, paint order and blend modes agree. Reusing the modern numerical profile is a documented floating-point tolerance; reusing its Forest palette would be wrong.
- The neighboring preview variants A1/A2/B use identical voice/chat gradient profiles and palettes. Their voice node is at x=−1, while the target homepage uses x=0. Both geometries are recorded.
- The neighboring Applications variant contains the same352-pixel legacy Concentric profile and colors as the nested homepage instance.
- Header previews contain no named pattern-family instances. Hero artwork`294:6292` is a single solid iris vector under a linear luminance mask, not one of the four procedural pattern families; its original SVG remains a separate asset.

This audit specifies source behavior. Rendered browser comparisons and any rasterization tolerances belong to the coordinating implementation's visual evidence.

