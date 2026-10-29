# Interactive hero atoms

The hero now uses a real p5.js 2.3.4 instance with its P2D renderer. Its native drawing context batches the dots into four paths per frame. No React state updates, DOM nodes per particle, WebGL contexts, blur filters, or allocations per particle are needed during animation.

## Visual decisions and source

- The existing hero layout, type, navigation and buttons are unchanged.
- `--hero-atom-color` is a local semantic alias for the original `--palette-iris` brand token. No new palette is introduced.
- The composition follows the supplied hero screenshot and existing `hero-Frame84.svg`: horizontally centered, focal point at roughly y=280 in a 1600×960 hero, with a fade toward the copy and bottom edge.
- Invisible circular paths, seeded dot distribution, 48px desktop / 35px narrow ring spacing, uniform 1.1px particle radius, pulse amplitude, and pointer forces are newly authored decisions for this request. This is deliberately a procedural interpretation, not a pixel-identical reproduction of the original random dot positions.
- The circular paths are invisible guides only: no strokes are drawn. Resting dot positions stay fixed. A 12-second opacity pulse provides idle animation. Actual pointer travel supplies a local, velocity-scaled scatter impulse; fast sweeps are sampled along their entire segment. Each particle has a stable individual scatter direction, so the disturbance breaks up the field rather than deforming it like a mesh. A stationary pointer applies no force. Displacements relax exponentially at 1.65/s, without spring momentum or overshoot. All dots retain the same 2.2px diameter.
- Touch movement uses passive pointer events; the decorative canvas never captures controls or prevents native page scrolling. Reduced motion renders a single still composition and disables pointer animation.

## Files and loading

- `src/components/home/hero-atoms.tsx`: client lifecycle and deferred import after the content render, with an 800ms idle timeout.
- `hero-atoms-sketch.ts`: p5 setup, seeded field, drawing, pointer interaction and lifecycle management.
- `hero-atoms.module.css`: positioning, semantic color alias and readability fade.
- `src/types/p5-core.d.ts`: types for p5's modular package exports. Only core and the accessibility lifecycle required by P2D are registered; optional full-package features are not registered.
- `public/assets/figma/hero-atoms-fallback.webp`: approximately 98 KiB raster of the original 1.2MB SVG, visible before startup, if the chunk fails, or without JavaScript. Generated with Sharp at 1600×960, WebP quality 80. The original SVG is retained.

The separately fetched p5 chunk is approximately 123 KiB gzipped; exact built chunk sizes are in `bundle.json`. This dependency is not zero-cost, but it does not block the server-rendered headline or controls.

## Performance and lifecycle

- Maximum 3,000 dots on desktop, 1,100 below 768px; offscreen circumference does not consume the budget.
- Device pixel ratio capped at 1.5 and total backing pixels capped at three million.
- 60fps target on fine pointers, 30fps on touch/coarse pointers; sustained draw costs above 10ms lower the target to 30fps.
- IntersectionObserver and document visibility pause the p5 loop. ResizeObserver redraws at the correct dimensions. Cleanup disconnects observers/listeners and removes the p5 instance.

## Reproduce verification

```sh
npm run build
npm run start -- --port 3001
# In another terminal:
node scripts/hero-atoms-check.mjs
npm run typecheck
npm run lint
```

Use `VISUAL_URL` to test another running server. The script saves screenshots and `results.json` in this folder. It checks real canvas pixel changes, slow-versus-fast pointer energy, offscreen pause/resume, live and initial reduced-motion settings, one canvas per hero, 1024/768/390/320px overflow, mobile pixel budget, passive canvas touch behavior, and no-JavaScript content/artwork. Chromium and WebKit both pass without page errors.

Measured drawing-function time in this local browser run: approximately 0.55ms Chromium and 0.40ms WebKit with 3,000 particles. These measurements exclude browser compositing and are not physical-phone benchmarks. Mobile checks use browser device emulation; low-end physical hardware has not been tested.

`chromium-desktop.png` and `webkit-desktop.png` show the integrated result at 1600×960. The mobile screenshots are fresh 390×844 loads at device scale factor 3. `motion.webm` shows the live pulse and a pointer sweep. These are visual evidence of the new interaction, not a claim of pixel equivalence to the static Figma artwork.

Update: `uniform-particles.png` shows the subsequent uniform-size revision. All dots now have a fixed 1.1px radius, including during hover; the browser drawing calls were checked during idle and pointer movement. Earlier screenshots and `motion.webm` predate this revision.

Velocity-scatter revision: `velocity-scatter.webm` and `chromium-scatter.png` / `webkit-scatter.png` show the current interaction. `disturbance-results.json` records browser checks of actual drawn particle positions: stationary hover leaves positions unchanged, a sweep displaces particles, and their return is monotonic without crossing their resting positions. Earlier motion evidence predates this interaction revision.
