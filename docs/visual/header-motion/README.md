# Desktop dropdown motion

The Applications, Infrastructure and Industries dropdowns use GSAP for a restrained 6px vertical reveal with opacity, taking 240ms to open and 160ms to close. Trigger backgrounds interpolate the existing secondary color over 180ms; chevrons rotate over 220ms. All use `power2.out`. These timings are implementation decisions for the requested motion, not values supplied by the still design.

`src/components/home/desktop-dropdown.tsx` keeps a closing panel mounted until its exit finishes. It becomes inert and hidden from assistive technology immediately when dismissed. Interrupted animations retain their current values; stale tweens are killed before a replacement starts. Escape restores trigger focus, outside clicks dismiss, menu switching is exclusive, and a completed close resets the Applications preview as before. Reduced motion selects the final state immediately, including when changed during a transition. The compact menu behavior is unchanged.

The only existing implementation files changed for this feature are `hero.tsx` and `hero.module.css`. Static dropdown dimensions, assets, typography and contents are retained. The small client component owns its GSAP animations and removes listeners/tweens on cleanup. It follows [GSAP's current-value tween behavior](https://gsap.com/docs/v3/GSAP/gsap.to()/).

## Evidence

Run against a running server:

```sh
VISUAL_URL=http://127.0.0.1:3000 node scripts/header-motion-check.mjs
```

[Results](results.json) include Chromium and WebKit entry/exit frame samples, trigger interpolation, rapid reopening, switching menus, Escape, outside dismissal, keyboard previews, live reduced-motion changes, desktop-to-mobile resize and compact menu usability.

The settled Applications panel remains exactly x204/y80, 736×444 at the original 1600px viewport. Captures and overlays use the original Figma export, cropping its known shadow margin at x33/y21 without realignment. Mean absolute channel error versus Figma remains 1.382 in Chromium and 2.045 in WebKit on the 0–255 scale.

Both settled browser captures are **pixel-identical to their pre-animation baseline**, with mean error 0. The [baseline comparison](baseline-comparison.json) records file hashes. The baseline was captured from an isolated production build with the original details/summary markup and CSS restored, using the same fonts, assets and browser settings. The retained `baseline-*.png` files are inputs to the regression check; do not regenerate them merely to make a failing comparison pass.

- [Chromium capture](applications-chromium.png) and [Figma overlay](applications-chromium-overlay.png).
- [WebKit capture](applications-webkit.png) and [Figma overlay](applications-webkit-overlay.png).

Targeted lint and an isolated production build (including TypeScript) passed, without replacing the main thread's running production build. The initial shared-workspace type check also passed. A later check during concurrent homepage work reported two unrelated TS2322 errors in `use-story-autoplay.ts` at lines 22 and 26; that carousel code was not changed by this task.
