# Homepage integrations

Static section after PyAI and before Industries. Revised to follow the supplied Lattice/Mobbin layout: a 12-column, six-row grid of quiet rounded tiles, sparse original logos, and a two-row central opening containing only the headline and CTA. The carousel and controls were removed following the user's correction.

The paper/forest palette, typography, outlined button and focus styling reuse existing tokens. Tile positions follow the screenshot composition; exact sizes and responsive behavior are implementation decisions. On mobile the grid becomes six columns with a taller central opening for readable text.

Original SVG marks were imported from [Composio's logo library](https://github.com/ComposioHQ/logo-cdn) through its documented `https://logos.composio.dev/api/{slug}` endpoint on 2026-10-28. Local files, source URLs and the MIT license are in `public/assets/integrations/`. No runtime SDK or API credentials are needed to display these assets.

`integrations.tsx` is a server component; `integrations.module.css` owns the grid and responsive layout. No carousel JavaScript, timers or animation loops remain. The CTA uses the existing contact page.

Run `node scripts/integrations-check.mjs` with dev at port 3001 for Chromium and WebKit checks and screenshots at 320, 390, 1024 and 1600px. Run `npm run typecheck` and `npm run lint` for code checks.
