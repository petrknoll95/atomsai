# Varied customer stories

The original Northwind story remains first. Three additional demo stories have unique copy, portraits, company names, people, roles and metrics. Their detail dialogs use the selected story at the time of opening and remain stable while the carousel advances.

Photo provenance and crop details: `public/assets/stories/README.md`.

Reproduce with the development preview running on port 3001:

- `node scripts/story-content-check.mjs`: checks all four stories at 1600, 1024, 390 and 320px in Chromium and WebKit; verifies original-first ordering, distinct quotes and decoded images, demo labels, dialog synchronization, and content/page overflow. Captures desktop and mobile screenshots for every story.
- `node scripts/story-portraits-check.mjs`: samples the eight-column, simultaneous center-out reveal; tests rapid navigation, looping, gestures, reduced motion and responsive alignment.
- `node scripts/story-slit-frames.mjs`: saves a six-frame visual sequence of the third-to-fourth portrait transition in `docs/visual/story-slits/frames.png`.
- `VISUAL_URL=http://127.0.0.1:3001 node scripts/story-carousel-check.mjs`: validates autoplay, progress, controls, keyboard operation and dialog behavior.

These are prototype stories, not verified customer claims. Stock portraits are stored locally as responsive WebP files and decode before each animated replacement.
