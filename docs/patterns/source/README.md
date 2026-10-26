# Original pattern source

Snapshot of Figma file `pLyUMYhdCUYzwz0UXPtGY8`, Components page `17:2`, section [`205:12328`](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=205-12328), read through the original Plugin API on 2026-10-26. The file uses **DISPLAY_P3**. No source nodes, variables, or modes were edited.

## What is retained

- `inventory.json`: the four component sets, their descriptions, variant properties, source master references, and all 14 variant IDs.
- `{kind}-density-{density}.json`: all 14 variant scene trees. Repeated rectangular slits are represented by one exact template plus count, step, every original child ID, and original node types. Concentric annuli remain individually represented.
- `theme-variables.json`: the 22 bound color roles, original variable aliases and resolved values in every Theme mode. The runtime chooses Forest Light (`5:0`) and Forest Dark (`5:2`) as `light` and `dark`; this is a deliberate subset of the five source modes.
- `repeat-masks.json`, `density-validation.json`, `completeness-validation.json`, and `normalized-scene-validation.json`: measurements across every variant, including mask counts, cross-density paint comparisons, effects, and exact slit geometry.
- `runtime-validation.json`: data integrity checks for the runtime exports.
- `extract-template.js`: the read-only Plugin API serializer. Substitute `__ID__` with a variant ID before running through `use_figma`. It can export the three striped families within the tool response limit.
- `extract-concentric-chunk.js`: the same serializer for batches of ten annuli. Substitute `__ID__` with a mask ID and `__START__` with the zero-based child offset. Concentric complete trees were assembled from the variant skeleton and these nonoverlapping chunks because complete gradient tables exceed the response limit.

The runtime representation lives in `src/components/patterns/source-data.ts`. It contains the three density-0 slit templates, metadata for all source densities, and both complete Concentric variant trees. There are 328 distinct gradient records and 12,859 unrounded original stops. Gradients are deduplicated only where their type, matrix, and every stop are identical. Source IDs remain attached.

## Coordinate and paint contract

`bounds` is local `[x, y, width, height]`. Both node and gradient matrices are the original Figma two-row transform flattened in **row-major order `[a, b, tx, c, d, ty]`**. Gradient matrices retain Figma's normalized paint-coordinate semantics. Stops are `[position, red, green, blue, alpha]`. Channel values are source Display P3 values, not converted sRGB hex approximations.

Only runtime root canvas placement is normalized to `[0,0,800,800]` and the identity transform. Original JSON retains component placement in its set. All variants have an 800×800 viewport and a principal 840×840 artwork field at (−20,−20). Child order, paint order, alpha, blend modes, clipping, mask types, blur, and the original vector rectangle paths are retained. Every paint includes its own opacity, blend mode, and visibility separately from the node values.

All 1,591 nodes were checked: there are no strokes, nonzero corner radii, or non-fill variable bindings, and the only paint types are solid and radial gradient.

## Measured density behavior

| Kind | Component set | Default | Published densities | Actual repeated count |
| --- | --- | --- | --- | --- |
| Drift | `77:2804` | 0 | 0, 1, 2, 3 | 5, 10, 20, 40 |
| Offset | `77:2805` | 0 | 0, 1, 2, 3 | 5, 10, 20, 40 |
| Single band | `77:2806` | 0 | 0, 1, 2, 3 | 5, 10, 20, 40 |
| Concentric | `77:2807` | 1 | 1, 2 | 15, **29** |

The only exposed source property is the `Density` variant selector. There is no numeric slit-count variable or property in the original components.

For the striped families, every slit has width `840/N`, height 840, and x position `i×840/N`. Maximum measured position/size deviation is zero for all published counts. Within each corresponding mask, every original gradient matrix and stop is identical across all four densities. Drift and Offset normalized scene trees are otherwise exactly identical.

Single band has a negligible original floating-point difference: seven mask/carrier x positions are `0.0000009999999974752427` in density 0 and zero in densities 1–3. Nothing else differs after normalizing count, IDs, names, and the rectangular vector representation. The reusable runtime template retains density-0 values. The exact per-density JSON retains the distinction.

Using other integer slit counts is an **implementation inference** based on the verified repeated geometry and invariant paints. Such counts are not published Figma variants.

For Concentric, density 1 uses pitch 42 and 15 full rings; density 2 uses pitch 21 and **29**, not 30, full rings. The source component-set description says 30; actual child counts, names, and geometry say 29. The original description is retained verbatim in metadata and must not be used as an authoritative count.

Full ring k has outer radius `k×pitch`, inner radius `(k−1)×pitch`, and center (420,420). The upper field uses two half-width annuli per full ring. The other three masks use one annulus per ring. Raw arc inner-radius floats and all unique ring paint tables are retained exactly. Gradient matrices/positions can be described procedurally, but the original alpha tables differ between densities and are not reducible to one verified shared alpha curve. Other ring counts therefore require a documented inference; this source file does not claim an exact original generator for them.

## Source behavior to preserve

- Drift lower/upper/highlight masks and Single band's four main masks use layer blur `1.8899998664855957`. Offset and Concentric do not use blur.
- Single band has a global luminance mask, nested field masks, and nested reflection filters. One reflection filter is an **alpha** mask at opacity `0.15000000596046448`; its parent uses `OVERLAY`. Flattening these into independent colored stripes changes the source composition.
- Single band's Shade mask (`77:1985`, inside filter `77:1984`) has no opaque black backing. An isolated original export is retained as `single-band-shade.png`. At x=400, y=200, the raw gradient alpha is approximately 0.4565 and the exported mask alpha is 53/255 (approximately 0.20784); at y=250, approximately 0.7709 becomes 152/255 (approximately 0.59608). This verifies effective squared-alpha behavior for this particular luminance mask. The other backed masks must not receive the same squaring.
- Concentric's reflection is an **ALPHA** mask, while its upper/lower/highlight masks use luminance. Reflection annuli have node opacity `0.20000000298023224` and opaque grayscale gradient stops. Their grayscale values therefore do not control this mask's alpha. This unusual original behavior is intentional to preserve, even if it looks like an authoring inconsistency.
- Concentric's reflection mask extends beyond the 840-pixel field (1260-pixel diameter in density 1; 1218 in density 2). Its carrier is the original 1240×1240 rectangle at (−200,−200), and its parent uses `LINEAR_DODGE`. Retained clipping determines the visible result.
- Theme inheritance selects Forest Light in the source components. No automatic operating-system theme choice is encoded in Figma. Runtime light/dark controls are application behavior.

