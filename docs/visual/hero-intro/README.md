# Hero particle entrance

The existing p5 canvas emits its seeded particles from the nucleus on first
load. Radial delay spans 0–750ms; each orbit expands with cubic deceleration over
1.85s, for a maximum 2.6s entrance. A small angular displacement unwinds during
the expansion. Every particle keeps the same 1.1px radius and iris color; no ring
strokes, springs, extra canvas, animation dependency, or secondary clock is added.

The intro advances only while visible, never restarts on resize or hover, and
finishes immediately for reduced motion. The settled geometry and existing
velocity-sensitive hover response are unchanged.

Run `node scripts/hero-intro-check.mjs` with the development preview on port 3001.
The test samples actual canvas pixels at five times and checks that the particle
field expands from the center. It covers Chromium/WebKit, desktop/mobile, resize,
hover without restart, and a fresh reduced-motion load. Results and sampled
canvas images are in this directory. Canvas images omit the CSS bottom fade so
the entire particle field can be inspected.
