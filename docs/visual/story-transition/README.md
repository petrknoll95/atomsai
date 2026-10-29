# Customer story cross-fade

The portrait behavior described below is historical. It has since been replaced by the [synchronized portrait carousel](../story-portraits/README.md); the content fade and object reveals remain in use.

The existing Embla carousel now uses its matching 8.6.0 [Fade plugin](https://www.embla-carousel.com/docs/v8/plugins/fade). Slides overlap at the same position; the carousel still owns selection, swipes, looping, and the existing seven-second autoplay clock.

GSAP reveals the incoming portrait with a restrained 1.025 → 1 scale over 900ms. The quote, attribution, logo, story button, and three result cards reveal individually through opacity and a 16px rise: 600ms per object, with 55ms stagger starting at 60ms. The complete sequence takes 990ms. A new selection reverts the previous timeline before starting another, preventing accumulated timelines or partially hidden objects. Reduced motion skips both the fade and object animation.

No story copy or layout changed. All four slots continue to repeat the supplied Northwind story until other content is available.

Run against the local production server:

```sh
VISUAL_URL=http://127.0.0.1:3001 node scripts/story-transition-check.mjs
VISUAL_URL=http://127.0.0.1:3001 node scripts/story-carousel-check.mjs
```

`cross-fade.webm` shows two transitions in the rendered homepage. `results.json` contains actual browser-frame measurements from Chromium and WebKit: overlapping slide opacity, aligned horizontal positions, staggered object opacity/translation, interrupted navigation, reduced motion, and narrow-screen overflow. The PNGs show the settled layout. The broader carousel check covers the autoplay clock, pause/play, looping, drag, keyboard controls, and story dialog.
