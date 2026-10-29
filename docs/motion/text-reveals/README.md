# Shared headline reveals

`src/components/motion/text-reveal.ts` owns the text animation recipe: 720 ms,
90 ms between lines, 14 px upward travel, `power3.out`, and entry at 88% of the
viewport. These are implementation choices for the requested subtle motion.
Use `revealTextLines` for text animation; do not copy these values into sections.

`use-headline-reveals.ts` applies the recipe to homepage `h1.display` and
`h2.display` headings. Add `data-text-reveal` to opt another static text block in,
or `data-text-reveal="off"` to opt an element/subtree out. Carousels and dialogs
retain their own interaction lifecycle and are excluded from page-entry reveals.

- Headlines initially in view reveal on load; others reveal once on scroll.
- GSAP SplitText measures actual wrapped lines after fonts load. Resizing restores
  the authored markup before remeasurement; already-started headings stay visible.
- Authored block spans retain their colors and spacing. A temporary one-pixel
  measurement allowance compensates for rounded advances in SplitText's word
  wrappers; final heading boxes retain their original measured widths.
- Headline sections skip the old whole-section opacity animation, avoiding two
  overlapping fades. Other section/artwork transitions stay independent.
- Reduced motion, focused headings, and anchor destinations show immediately.
  Server HTML is readable without JavaScript. A 1500 ms font timeout fails open.
- Resize/media listeners, observers, generated markup, and tweens are scoped and
  cleaned up. Only transforms and opacity animate; layout stays still.

API reference: [GSAP SplitText](https://gsap.com/docs/v3/Plugins/SplitText/).

## Verification

Run against a current build:

```sh
VISUAL_URL=http://127.0.0.1:3001 node scripts/text-reveal-check.mjs
```

The script checks Chromium and WebKit at 1600 px and 390 px, then resizes to
768 px/320 px. It records actual intermediate line-opacity values, compares
headline dimensions with the unsplit reduced-motion version, and checks scroll,
focus, deep-link, reduced-motion, and overflow behavior. Screenshots and results
are saved beside this document.

The side-conversation verification preview uses port 3101 and an isolated
production build, leaving the main task's server/build output untouched.
