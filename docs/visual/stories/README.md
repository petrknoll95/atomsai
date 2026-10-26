# Customer Stories autoplay

The static four-line indicator is now an Embla 8.6 carousel with the matching `embla-carousel-autoplay` plugin. Each active line fills from left to right using the plugin's `autoplay:timerset`, `autoplay:timerstopped` and `timeUntilNext()` API. There is no separate timer that could drift away from slide selection. The active line expands to the existing 3.285714 proportion; the other lines return to equal widths.

- The entire story (photo, quote, attribution, logo and results) moves as one slide.
- Slides advance every **7 seconds** and loop. This duration is an inferred implementation choice, defined by `STORY_DELAY` in `src/components/home/use-story-autoplay.ts`.
- Click any line to select its slide; each line has a 44px keyboard/pointer target despite its 4px visible height.
- Hover, drag (including holding the pointer down), focus, indicator selection, and opening a story do not stop or reset playback. Manual navigation transfers the remaining interval to the new active line. Only the explicit Pause control stops playback during normal interaction.
- Playback continues offscreen. It is suspended while the browser tab is hidden and when reduced motion is requested.
- Reduced-motion mode disables automatic rotation and the filling animation; manual slide selection remains available, with a solid active line.
- Inactive slides are inert and hidden from assistive technology. Existing story dialog closing restores focus to the currently active story, even if the carousel advanced while the dialog was open.

## Content limitation

The supplied Figma source (`docs/design/source/stories.txt`) contains only the Northwind Logistics story. At the user’s request, the four slots **temporarily repeat that same approved story**. No new customer quotes, metrics or identities were invented. The remaining three stories need approved content before this can represent four distinct customer stories. The initial selected position remains the third indicator, as shown in the source.

## Verification

Run against a development or production server:

```sh
VISUAL_URL=http://127.0.0.1:3000 node scripts/story-carousel-check.mjs
npm run typecheck
npm run lint
```

`checks.json` records browser results; the screenshots show a partially filled active indicator and the narrow layout. The test verifies timer progress, automatic advancement, wraparound, uninterrupted hover/drag/focus and direct navigation, explicit pause/play, continued rotation behind the dialog, dialog focus restoration, reduced motion, and widths 1200/768/390/320 without horizontal overflow.

Production compilation was also checked in an isolated copy using `npm run build -- --webpack`, to avoid replacing the main conversation's running production build. The running development preview reflects these source changes immediately. The production preview on port 3001 is managed by the main task; the verified development preview uses port 3000.

Official API reference: https://www.embla-carousel.com/docs/v8/plugins/autoplay

## Embla 8 interaction adapter

In Autoplay 8.6, `stopOnInteraction: false` still stops the timer on pointer-down and restarts it on pointer-up. `createStoryAutoplay()` omits those two plugin event subscriptions during initialization, while preserving Embla’s actual drag behavior and all other plugin lifecycle events. Hover and focus stops are also disabled. No second slide timer or package upgrade is required.
