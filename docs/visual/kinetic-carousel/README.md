# Kinetic industry carousel

This correction replaces the original implementation's full-gallery slides with **one fixed-size circle per Embla slide**. The windows change width and position continuously with Embla's actual scroll position. Circle images are never stretched or swapped during a transition.

Live source inspection of Figma `186:4407` confirms a 1504px gallery, 669.090881px circle diameter, 8px gaps, and visible window widths of 20%, 40%, 100%, 40%, 20% of that diameter. It contains no transition reactions. The interpolation between these measured states follows the requested kinetic reveal; its timing is an implementation decision.

Embla still owns input, momentum, snapping, looping and reduced motion. Its standard track translation is disabled while each actual circle receives its own translation and clipping inset. The viewport keeps a constant height. Two cycles of the existing four categories supply offscreen neighbors for seamless looping; these are individual circles, not duplicated gallery compositions. The far-right Figma placeholder repeats Healthcare; a consistent four-category loop shows Manufacturing in that outer sliver instead. Labels stay attached to their own images.

Mobile retains the prior 1:8:1 hierarchy, with the same effect and three visible circles. Reduced-motion button navigation jumps directly to the requested state; direct dragging remains tied to the pointer.

Carousel descriptions were subsequently filled from the live homepage industry cards on 26 October 2026 and verified on the corresponding [Manufacturing](https://atomsai.com/industries/manufacturing), [Healthcare](https://atomsai.com/industries/healthcare), [Insurance](https://atomsai.com/industries/insurance) and [Logistics](https://atomsai.com/industries/logistics) pages. Each Learn More link now uses that industry's destination. These descriptions supersede the original Insurance-only Figma copy.

At the user's request, label circles were then enlarged from 140px to 200px on desktop and from 84px to 112px on mobile, with white label text. Their original translucent fill and blur are retained; these are intentional overrides of the Figma badge styling shown in the earlier captures.

Reproduce with the app running:

```sh
node scripts/kinetic-carousel-check.mjs
```

Set `VISUAL_URL` to use another server. The check verifies a constant circle diameter throughout sampled motion, changing masks, loop boundaries, category selection, focus restoration, real touch swipes with both motion preferences, and Chromium/WebKit layouts at 1600, 1024, 768, 390 and 320px.

- [Transition filmstrip](filmstrip.png)
- [Original Figma / browser overlay at rest](figma-overlay.png)
- [Measured results](results.json)

The comparison uses the retained original Figma export, without translating or warping either image. The outer placeholder change is visible in the overlay and is not included in any claim of pixel identity.

Validation on 26 October 2026 used an isolated production snapshot of the homepage at `http://127.0.0.1:59720`, so concurrent pattern-component work could continue without restarting its servers. That homepage build and TypeScript checks passed; lint passed for the changed source and verification script. The motion check sampled 83 frames with 79 distinct mask states and a maximum measured diameter variation of 0.000123px (browser coordinate precision).
