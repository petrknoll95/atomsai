# Voice preview: button glass and waveform

Source: [homepage preview instance 343:7614](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=343-7614). Read on 2026-10-26 using design context and original instance properties.

- Voice panel `I343:7614;298:6328`: 736 × 320, white at 10%, BACKGROUND_BLUR radius 36. Figma's generated CSS maps this to `blur(18px)`.
- Button `I343:7614;298:6334`: 173 × 56, 28px horizontal padding, 8px icon gap, white at 10%, the same blur effect. Existing typography and button interaction are retained.
- Waveform `I343:7614;298:8658`: 736 × 320 mask; source ticks are 1 × 6 with a 2px gap and 10% opacity. Its luminance mask has a black inner shadow, radius 120 and spread 56.
- `preview-waveform.svg` and `preview-voice-icon.svg` are unmodified exports of the instance's original waveform and 24px icon. Figma's SVG export omitted the mask's inner shadow, so the waveform additionally uses the original `preview-waveform-fade.svg` mask supplied by design context. All asset dimensions stay at their native size; narrow containers crop the waveform instead of stretching its ticks.

The panel glass is a separate pseudo-element. Chromium uses native button backdrop blur. WebKit did not render the overlapping button backdrop filter in browser pixel checks, so its button uses a clipped, synchronized copy of the original shader, the source waveform, and two 10% white layers. The two 18px background Gaussian passes combine to sqrt(18² + 18²) = 25.455844px; the waveform receives 18px blur. `syncWith` follows the original canvas phase without React updates or geometry reads each frame. The copy is hidden and never creates a renderer in Chromium; it retains normal offscreen/reduced-motion behavior in WebKit.

Reproduce with `node scripts/voice-preview-check.mjs` against port 3001, or set `VISUAL_URL`. The check verifies source asset dimensions, actual rendered blur by comparing enabled/disabled blur pixels, synchronized phases, and controls/overflow at 768, 390 and 320px in both browsers. `results.json` records the outcomes. Type, lint and production build are checked separately.

`figma-widget.png` is the original main-component widget render (991 × 640); the homepage instance is 992 × 640. `comparison.png` shows the reference above the rendered Chromium widget; `overlay.png` aligns them at the top-left, cropping the extra rightmost homepage pixel. The pre-existing helper-text wording and broad background-shader rendering differ from this Figma reference and are outside this button/waveform correction. The comparison is evidence for the targeted controls and waveform, not a claim of pixel identity for the entire widget. The animated pattern is frozen under reduced motion for these captures.
