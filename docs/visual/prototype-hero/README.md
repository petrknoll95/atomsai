# Imported Concept A hero

Source: `/Users/petrknoll/Documents/GitHub/atoms-ai-brand/hero-prototype` (`Hero.astro`, `hero-field.ts`, and `nebula-01.json`). The source identifies Figma Concept A node 127:5111 and derives its nebula coordinates from frame 01. This integration reuses that supplied implementation and data; no fresh Figma measurement was performed.

The existing pill header and header interactions are retained. The hero's headline, supporting text, and CTA now align to the header's inner content edges, including its centered maximum width. The prototype's local cream/green colors and particle configuration are retained instead of changing the site's shared palette.

The nebula organizes into rings over the first 42% of the original 380svh particle sequence, then the perspective dive expands the central green dot. A white particle grows inside it from 350–440svh, revealing the fully opaque Offerings section as it rises from up to 420px lower. From 440–520svh the completed section stays pinned for reading, then continues in ordinary document flow. Neither the section nor its headings fade through the green particle. On mobile the stage includes the full height of the stacked cards, so no cards are cut off. There is only one copy of the section and its interactive links.

On desktop, the label and cards are centered together in the space below the header, with a 12px optical lift. Compact screens use a 270svh track (190svh particle sequence, white reveal at 170–240svh, 30svh reading hold), a smaller rise, and cards that fit smaller phone heights before releasing into the full stack. Short touch landscapes use 220svh with only a 10svh hold. CSS owns the responsive timing values and the canvas reads them on setup/resize. Stable viewport units avoid browser-toolbar jumps; native touch scrolling remains enabled. The canvas renders at native device pixel density, including Retina desktops and 3× phones; touch devices retain the 30fps animation budget without sacrificing particle sharpness.

GSAP ScrollTrigger pins the stage to cooperate with the existing ScrollSmoother. The p5 module loads asynchronously, pauses offscreen/when the document is hidden, and removes its canvas and observers on unmount. Reduced motion uses a shortened track and a direct transition with no zoom or vertical rise. If the optional field cannot load, hero copy and the next section remain in normal flow. Section-link scrolling accounts for the reveal's pinned position.

The port lives in `src/components/home/prototype-hero/`; header code remains in `home/hero.tsx`. The source prototype has not been edited.

Pointer interaction carries over the previous hero's sweep-based scattering: 110px mouse / 80px coarse-pointer reach, speed-sensitive force, a 120px displacement limit, and exponential settling at 1.65/s without springs or overshoot. Each traveled segment is consumed once, so holding the pointer still adds no force. Offsets operate in screen pixels for the same feel in the nebula and rings, then fade out during the dive to preserve the centered section reveal. Reduced motion disables scattering; touch listeners are passive and leave native scrolling available.

The first paint reserves the full scroll track and the reveal's natural height before the canvas loads. Copy fades in after fonts settle, avoiding the fallback-font width and line-wrap jump. With scripting disabled the text is immediately visible and the sections use normal document flow.

During the dive, the surrounding cream surface smoothly blends into the next section's paper background. The particle shade palette follows the same blend, avoiding cream-colored fringes on the lighter surface. This is scrubbed in both directions; the white aperture and its content remain opaque.

The logo-inspired slit treatment remaps particle X positions into alternating vertical bands, producing compression and separation in the rings. `CONFIG.slits` controls the 170-design-pixel pitch, 40px shift and softened seams. The offsets breathe slowly, stay softer in the nebula, protect the central seed, and fade out early in the dive. This is a particle-coordinate effect, with no panels or masks over the content; reduced motion holds it still. `slits-1600.png` and `slits-390.png` show the settled treatment.

## Verification

With the existing preview running on port 3001:

```sh
node scripts/prototype-hero-check.mjs
node scripts/prototype-hero-pointer-check.mjs
node scripts/prototype-hero-loading-check.mjs
node scripts/prototype-hero-mobile-check.mjs
```

The script checks Chromium/WebKit, desktop and mobile alignment, scroll scrubbing, the visible and interactive next section, release into normal scrolling, reverse scrolling, section navigation, reduced motion, and browser errors. Screenshots and `checks.json` are written here. Source-based changes intentionally supersede earlier split-hero and old particle-hero image baselines.
