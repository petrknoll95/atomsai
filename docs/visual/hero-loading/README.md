# Hero loading handoff

The old loading state rendered a fixed 1600×960 static image before replacing it
with responsive p5 particles. At narrow widths the two distributions visibly
jumped. Normal loading now contains no fallback image; the canvas fades in over
420ms only after its first draw marks it ready. Reduced motion skips that fade.
The static artwork is retained only for a failed lazy import or disabled JavaScript.

Run `node scripts/hero-loading-check.mjs` with the development preview on port
3001. It deliberately delays p5 chunks, checks that the fallback is neither
rendered nor downloaded on normal loads/reloads, and checks no-JavaScript
fallbacks in Chromium and WebKit. Loading/ready captures and results live here.
