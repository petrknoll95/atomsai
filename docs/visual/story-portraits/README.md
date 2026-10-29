# Synchronized portrait carousel

The portrait is now one persistent, rounded Embla viewport outside the content's fade layer. Its four image slides move horizontally; neither the frame nor the portraits fade. Selecting a story moves the image carousel, and swiping an image selects the corresponding story. Only the main story carousel owns autoplay and its progress timer. Selection equality guards prevent synchronization loops.

Each fading story reserves the original image grid cell. The persistent viewport matches that cell at desktop, tablet, and mobile breakpoints. The quote, attribution, logo, button, and results retain their existing GSAP reveals. Reduced motion jumps both carousels to the selected story. Native image dragging and text selection remain disabled.

Only the original Northwind portrait has been supplied, so the existing four repeated story slots continue to use that image.

Run against the local server:

```sh
VISUAL_URL=http://127.0.0.1:3001 node scripts/story-portraits-check.mjs
VISUAL_URL=http://127.0.0.1:3001 node scripts/story-carousel-check.mjs
```

`results.json` records actual Chromium and WebKit animation frames: outgoing and incoming images move together at full opacity while content cross-fades, with a fixed wrapper size. It also records forward/reverse loops, interrupted navigation, image swiping, reduced motion, and alignment at eight widths from 320px to 1600px. PNGs show the final tablet and mobile layouts; `portrait-slides.webm` shows the live transition.
