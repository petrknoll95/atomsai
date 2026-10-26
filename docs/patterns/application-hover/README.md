# Application hover patterns

All four application cards start as outlined circles with dark original dot icons and outlined links. Hovering a card or focusing its Explore link with the keyboard reveals its shader, changes the icon to cream, and fills the link with deep green. Hover and keyboard focus are tracked independently, so leaving a focused card with the pointer does not remove its active treatment. Touch does not latch a hover state or intercept the link's first tap.

| Application | Pattern | Density | Color source |
| --- | --- | --- | --- |
| JustCall | Drift | 5 slits | Current Figma Theme / Iris Light |
| Helpwise | Single band | 5 slits | Current Figma Theme / Iris Light |
| ServiceAgent | Concentric | 15 rings | Original homepage instance's legacy Iris overrides |
| CallPage | Offset | 20 slits | Current Figma Theme / Iris Light |

The [source audit](source-audit.md) distinguishes the inspected Figma values from decisions. Figma supplies ServiceAgent's active appearance, the other three idle appearances, the four original icon masters, circle dimensions, and the pattern geometry. The user identified the shown treatment as hover. Figma has no encoded hover variants, timing, easing, or distinct pattern assignments for the other three applications. Their family/density assignments above are implementation decisions using source-backed pattern presets. All four use Iris to preserve the section's existing color hierarchy.

Current Figma Iris recipes use the F0EBF5 tint; the older brand materials and homepage Concentric use D8CDE5. The new assignments follow the current theme roles, while ServiceAgent retains the exact older overrides, including its nonblack reflection backing. Source colors remain numerical Display P3 values rather than screenshot samples.

## Implementation conventions

- `src/components/home/application-card.tsx` owns the small client interaction boundary. Section content remains server-composed in `applications.tsx`.
- `--application-progress` is a section-local, unitless state value from 0 to 1. GSAP drives it; scoped CSS interpolates pattern opacity/scale, semantic icon/button colors, and the measured 10%-to-5% circle border opacity. Palette and color-role tokens are unchanged.
- `src/components/patterns/home-pattern.tsx` holds the four named `applications-*` configurations. Original pattern shader data and renderer are unchanged. Original SVG icons are used as masks, so the dot geometry is retained while color can change.
- The inferred reveal lasts 480ms with GSAP `power2.out`; reversing from the full reveal takes 320ms. Interrupted transitions continue from their current position. Only the pattern scales subtly from 1.035 to 1; the final crop, icon, circle, text and button positions do not move.
- Reduced-motion preferences select the same final states immediately and disable the scale, including when the preference changes during a transition. The existing focus ring remains visible. A single GSAP tween per card and all event listeners are cleaned up on unmount, following [GSAP context cleanup](https://gsap.com/docs/v3/GSAP/gsap.context()/).
- The four canvases stay mounted, initialize near the viewport, and render stills. Hover animates their composition without changing shader options or redrawing them every frame. Full-page context/overflow checks cover the resulting 10 active Chromium / 11 active WebKit canvases.
- ServiceAgent's button retains its original Primary width throughout the transition; its idle outline is accommodated inside that width. Other buttons retain their original Outline widths. Responsive grid decisions are inherited from the existing page because no mobile variant is supplied.
- Circle borders overlay the artwork instead of consuming its layout area, preserving the original 352×352 shader field. An aligned browser comparison caught and corrected the previous 1px inset (350×350 field).

## Reproduce and review

Build and serve the production app:

```sh
npm run typecheck
npm run lint
npm run build
npm run start -- --port 3001
```

Then run in another terminal:

```sh
VISUAL_URL=http://127.0.0.1:3001 npm run test:application-hover
VISUAL_URL=http://127.0.0.1:3001 npm run test:home-patterns
VISUAL_URL=http://127.0.0.1:3001 VISUAL_DPR=2 npm run test:home-patterns
VISUAL_URL=http://127.0.0.1:3001 npm run visual
```

The hover check writes browser captures, an aligned ServiceAgent-hover overlay and amplified difference against the original 1600×903 Figma section, and [results.json](results.json) in this directory. The three additional hovered appearances have no supplied Figma reference; their screenshots verify the implemented assignments rather than claim an exact match to nonexistent source states. The full homepage comparison deliberately hovers ServiceAgent at 1600px to reproduce the illustrated reference state, while responsive captures show the new neutral default.

- Chromium: [default](default-chromium-1600.png), [JustCall](justcall-chromium-1600.png), [Helpwise](helpwise-chromium-1600.png), [ServiceAgent](serviceagent-chromium-1600.png), [CallPage](callpage-chromium-1600.png).
- WebKit: [default](default-webkit-1600.png), [JustCall](justcall-webkit-1600.png), [Helpwise](helpwise-webkit-1600.png), [ServiceAgent](serviceagent-webkit-1600.png), [CallPage](callpage-webkit-1600.png).
- Source comparison: [original](../../visual/comparison/applications-reference.png), [Chromium overlay](serviceagent-chromium-overlay.png), [Chromium difference ×4](serviceagent-chromium-difference-x4.png), [WebKit overlay](serviceagent-webkit-overlay.png), [WebKit difference ×4](serviceagent-webkit-difference-x4.png).

Final production checks passed in both Chromium and WebKit: all four animated entry/exit states, interruption/reversal, independent keyboard/pointer focus, live reduced-motion changes, 1200/768/390/320px layouts, and first-tap touch navigation at 768/390/320px. On macOS, the WebKit check uses Safari's Option+Tab link-navigation shortcut; it verifies visible focus on the original links.

At the original 1600×903 section dimensions, the ServiceAgent-hover comparison has mean absolute channel error **0.562/255 in Chromium** and **1.134/255 in WebKit**; respectively **0.596%** and **1.091%** of pixels have any channel difference above 32. The remaining differences are concentrated in text/vector edges and small gradient/clip rasterization differences. These are reviewed comparisons, not a claim of pixel identity. The three newly assigned hover states have no original counterpart for a direct pixel comparison.
