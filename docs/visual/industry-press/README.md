# Industry carousel press feedback

Pressing the Embla gallery deepens every circle's clip to 6.5% of its diameter,
clamped to 18–36px. GSAP eases inward over 450ms and returns to the existing
0px resting / 12px hover inset over 1.2s. Slide measurements and Embla's side
masks remain unchanged. Reduced motion resolves both states immediately.

Pointer release, touch cancellation, window blur, hidden documents, resize
reinitialization and unmount all release or clean up the held state.

With the preview running on port 3001, reproduce with:

```sh
node scripts/industry-press-check.mjs
```

The check samples all eight circles during the transition, verifies unchanged
widths, exercises dragging and release in Chromium and WebKit, and checks real
Chromium touch release/cancellation. Hover and held screenshots are included
alongside the measured values in checks.json.
