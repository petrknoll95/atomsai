# Integrating with the brand guidelines site

The source repository is [atoms-ai-brand](https://github.com/petrknoll95/atoms-ai-brand). Prefer an existing local checkout and its current unpushed work. A published site or bundled snapshot can lag the checkout. The standalone runner never edits the gallery.

## Sources to extend

- `src/data/colors.ts`: palette.
- `src/scripts/illustration-3d/geometry.ts`, `primitives.ts`, `models.ts`: geometry, camera, scene definitions and reference fit.
- `src/scripts/illustration-3d/render.ts`: depth projection and SVG serializer.
- `src/scripts/illustration-3d/canvas.ts`: painter for the same projected frame.
- `src/scripts/illustration-3d/controller.ts`: p5 lifecycle, resize, rotation, loop playback and export preparation.
- `src/scripts/illustration-3d/motion.ts`: one motion loop per gallery example, built from named model parts.
- `src/components/Illustration3D.astro`, `src/pages/illustration.astro`: card and visible gallery registration.
- `src/scripts/illustration-3d/data/reference-metrics.json`: framing and historical source hash. Its slug list includes retained, non-gallery models; use actual page registration for the visible gallery.
- `src/assets/brand/illustration/`: source references. Preserve an existing original. Newly approved concepts may use a generated neutral SVG as their first master.
- `src/scripts/actions.ts`, `src/scripts/svg.ts`: copy/download, `asset:prepare-export`, color resolution and PNG rasterization.

## Add a selected scene

1. Transfer the recipe's raw construction into a new `makeScene` case. Preserve its deliberate pose and mode. Do not transfer a fitted scene then let `makeScene` fit it again.
2. Start its metrics entry by copying the recipe reference's `frame` and `bounds`, which exactly preserves reviewed framing. Set `sourceHash` to SHA-256 of the approved neutral SVG stored under the new slug. Document which reference supplied framing; bounds are framing inputs, not a tracing instruction. Existing originals are unchanged.
3. Register the slug/title once in the appropriate page array and pass the same master to `Illustration3D`. The current shared UI supplies Dark/Light moon/sun controls, reset and exports. Keep removed examples removed unless requested; retained Handoff code is not an active gallery recommendation.
4. Add meaningful concept-specific geometry checks and update the expected scene inventory in `scripts/check-illustrations.mjs`. Validate the actual page/metrics/model relationship, not just a total count.
5. Give it a motion loop. In `makeScene`, wrap each primitive that moves in `part(s, name, dimensions, build)`; record the centers, axes and radii the motion needs. In `motion.ts`, write the loop in model space with the existing rigid, scale, stretch and dash-phase helpers. The animator applies the pose and reference fit, reuses everything that stays still and keeps one rotation fit for the whole loop. The check script requires every registered example to have a loop that starts on the still, closes without a seam and keeps the visual contract.
5. Rebuild the skill bundle with `node scripts/build-illustration-skill.mjs` when canonical scenes, palette, gallery registration or renderer change. It regenerates runtime snapshots, current contact sheets and source hashes. Never hand-edit those generated resources.

## Preserve the shared preview

Each visited card owns a p5.js instance. It paints shared 3D projection commands directly into Canvas2D; the visible result is not an image of an SVG and does not use material lighting. SVG serialization happens only for export. The camera, fit, strokes and gradients remain shared.

Keep the existing controls and compact layout. Background/reset controls sit inside the panel at the top; exports at the bottom. Reset appears only for a changed orientation. No rotation hints, tooltips or Compare original control. Dark is default. Exports use the latest orientation and theme, even if screen painting is queued.

The canvas uses ResizeObserver, preserves aspect ratio and margins, and caps density at 2. It must not crop artwork, overlap controls, or stretch at narrow widths.

Retain p.noLoop(), lazy mounting, visibility pause and cleanup. Coalesce pointer movement to one requestAnimationFrame paint using the latest input; only dirty visible previews redraw. Cache geometry/projected frames and reuse scratch surfaces. During drag, do not serialize SVG, replace DOM art, decode images, allocate blobs or read layout. Keep spatially bucketed depth tests and sample compression; preserve corners and visibility boundaries.

A loop paints at up to 60 fps, only while its card is on screen and the page is visible, and never repaints a hold. All playing loops share an 8 ms paint budget per display frame; past it, a loop waits one frame. Reduced motion starts every loop paused on the still; the pause control sits beside Reset view. A playing loop exports the still; a paused loop exports the frame shown.

## Required checks for gallery work

- Compare the neutral live canvas and rotated Dark/Light views with the recipe review. Inspect responsive desktop/narrow cards, drag/reset and final SVG/PNG downloads.
- Verify reset returns exactly to neutral. Rotate only one preview and confirm neighbors stay idle. Read the development `data-preview-stats`: export counts must not increase during drag. Measure actual drag responsiveness separately from CPU projection/paint time.
- Run `node scripts/check-illustrations.mjs`, `npm run check`, `npm run build`, `npm run check:skills`, `node scripts/check-illustration-skill.mjs`, and `node scripts/build-illustration-skill.mjs --check`. The kit test unpacks the actual ZIP and renders both recipes without repository imports.
- A successful build and numeric tests supplement visual inspection; they do not replace it. Keep generated test scenes outside the gallery unless the user asks to include them.
