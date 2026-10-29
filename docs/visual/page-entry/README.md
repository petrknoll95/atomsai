# Header and hero entrance

The fixed header starts above the viewport, including its 24px background fade,
and descends over 1.1 seconds with a soft ease-out. The hero badge enters at
220ms, supporting paragraph at 620ms, and the two actions at 820ms and 940ms.
Each fades and rises 18px over 900ms. The existing GSAP headline reveal and p5
particle entrance remain independent and unchanged.

These transform/opacity animations begin from the stylesheet before hydration,
preventing a flash of the header at its final position. Backwards-only fill
releases transforms when finished. Focus makes the corresponding area visible
immediately and marks its entrance complete, so blur does not replay it.
Reduced motion and print skip the sequence; no-JavaScript content remains usable.

With the development preview on port 3001, run:

```sh
node scripts/page-entry-check.mjs
```

Checks cover Chromium/WebKit at 1440px and 390px, initial offscreen placement,
final geometry, stagger, menus, focus interruption, reduced motion and no-JS.
The test records natural load frames and also seeks the actual CSS animations
after load to inspect intermediate positions deterministically: main-thread
shader setup can interrupt JavaScript sampling in headless browsers while
compositor animations continue. Results, frame records and captures are here.
