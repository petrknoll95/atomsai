# Story portrait seam

The source WebP contains a faint pale outermost column. Independently transformed
Embla loop slides can also expose the backing at fractional pixel positions.
Each picture now overlaps its neighbours by 1 CSS pixel and crops 1 CSS pixel
from its enlarged image. Slide widths, snap positions, outer rounding and the
content crossfade are unchanged.

Run the local preview on port 3001, then:

```sh
node scripts/story-seam-check.mjs
```

The check holds real pointer drags at three intermediate positions, at 390,
947, 1001 and 1600px widths, using pixel densities 1 and 2 in Chromium and
WebKit. It uses a magenta backing to detect uncovered gaps and samples pixels
across the moving join to detect a bright fringe. Results are in `results.json`;
`*-after.png` show the real backing restored for visual inspection.
