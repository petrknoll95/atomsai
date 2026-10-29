# Product preview blur during reveals

Run `node scripts/dropdown-blur-transition-check.mjs` with the development preview on port 3001.

The old transition faded the surface tint and foreground separately, leaving full-strength blur planes behind until `visibility: hidden` at completion. Overlapping outgoing/incoming figures therefore blurred each other; fading an ancestor around those cards also excluded the shared sibling shader from their backdrop.

Each figure now contains its own shader background and glass UI. GSAP composites that complete scene while gently staggering the objects' vertical movement. The blur radius and glass tint stay constant. Incoming scenes wait for their first shader frame. Backgrounds are created on first visit, cached while the menu is open, and only the selected one animates; closing the dropdown disposes them.

Evidence:
- `before-40.png`, `before-120.png`, `before-220.png`, `before-360.png`: old live transition captures.
- `chromium-*ms.png` / `webkit-*ms.png`: live new transition frozen at 40, 120, 220, 360 and 520 ms after hover.
- `*-partial-blur.png` and `*-partial-no-blur.png`: identical frozen in-flight scene with and without the card's blur.
- `checks.json`: every-frame scene state, shader readiness, constant glass blur, and optical comparison results.

Chromium confirms blur in the actual partial-opacity transition (mean pixel difference > 1 RGB level when disabled). This headless WebKit build does not rasterize backdrop blur even in a standalone striped reference fixture, so its optical result is unavailable; frame state, rapid switching, reduced motion, shader pausing, and teardown pass in both engines. Native Safari visual behavior is not verified by this test.
