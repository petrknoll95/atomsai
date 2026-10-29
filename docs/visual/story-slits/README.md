# Eight-column portrait transition

The story portrait uses eight vertical masks, all starting and finishing together with no stagger. The left four masks open from right to left, and the right four from left to right: away from the center. Incoming image offsets start toward the center and settle outward while scaling 1.1 → 1; outgoing offsets radiate outward with a small zoom. The reveal settles in 0.8s. A single unsliced image remains beneath the transition and is used alone at rest to prevent fractional-width seams.

Embla still owns selection, swiping, looping and autoplay. GSAP owns only the portrait's masked visual layers. Existing pause, previous, next and pagination controls remain in place. Rapid input speeds up the current transition and coalesces to the latest requested slide; it does not build a queue of obsolete animations. Reduced motion skips the slit animation. Resize and unmount clear the transition.

The first story keeps the supplied Northwind portrait and copy. Three additional, visibly labeled demo stories use distinct locally optimized Unsplash portraits. Quotes, people, company names, metrics and detail dialogs share one data source in `story-data.ts`. Portraits decode before a transition starts and preload only near the carousel. See `public/assets/stories/README.md` for photo credits and provenance.

Reproduce against the development preview on port 3001:

- `node scripts/story-portraits-check.mjs` — frame-by-frame mask/scale assertions, content crossfade, loop/reversal, rapid clicks, swipe, reduced motion and alignment at 1600/1200/1199/1024/768/767/390/320px in Chromium and WebKit.
- `node scripts/story-slit-frames.mjs` — freezes live frames at 0, 160, 340, 560, 820 and 1160ms; saves individual captures plus `frames.png` in that order.
- `VISUAL_URL=http://127.0.0.1:3001 node scripts/story-carousel-check.mjs` — existing autoplay, control, accessibility and dialog checks.
- `node scripts/story-seam-check.mjs` — exposed backing / white-edge checks at slit boundaries.

`results.json` contains per-frame mask and transform values and responsive geometry checks.
