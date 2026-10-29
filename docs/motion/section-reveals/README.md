# Section scroll fades

All outer homepage sections and the footer now participate, including sections
with animated headlines. The hero retains its own load-in sequence. Previously,
sections with headings were excluded and the initially focused document body
also forced the first section visible, bypassing most of the intended effect.

A section starts fading when its top enters the upper 72% of the viewport. The
fade takes 1.1 seconds with GSAP power2.inOut easing. It changes only opacity;
section dimensions, artwork positions and scroll geometry remain unchanged.
Reveals run once. Deep links and keyboard focus reveal immediately; reduced
motion, printing and JavaScript-disabled browsing show all content.

Validation against the local preview:

```sh
node scripts/section-reveal-check.mjs
VISUAL_URL=http://127.0.0.1:3001 node scripts/text-reveal-check.mjs
```

The section check records opacity samples and verifies monotonic fades, stable
geometry, revisiting, focus, hash navigation, motion preference changes, print,
responsive layouts and no-JavaScript output. The headline check also verifies
that the enclosing section reaches full opacity alongside its line reveal.
