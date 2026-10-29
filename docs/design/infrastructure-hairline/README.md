# Infrastructure dropdown illustrations

Three original drawings built with the Hairline create skill, using AtomsAI's isometric illustration guidance from `atoms-ai-brand/skills/atomsai-brand/SKILL.md` and `src/pages/illustration.astro`.

- **Server modules:** four ventilated modules with ports and status lights on one foundation. The selected module slides forward; neighbours respond with a smaller staggered move.
- **Test bench:** six socketed modules with contact marks, one raised at rest. The selected module lifts from its socket.
- **Precision assembly:** an exploded base, housing and cover with recessed surfaces and mounting holes. The selected part lifts, followed by the part above it.

## Delivery

The header uses `InfrastructureFigure` for these three links only. Drawings use Deep green on neutral gray with opaque faces, proportional 1-unit strokes, rounded contours, and a single line color at full opacity. Infrastructure and Company share the same 20px rounded card wrapper, 28px padding and 12px gaps. Uniform stroke styling overrides Hairline's default highlight hierarchy at the user's request. Existing image cards in other menus are unchanged.

`public/assets/illustrations/*.svg` are complete static fallbacks. The small optional runtime loads on mounting this menu and adds pointer responses. No labels or controls are shown in the navigation. The unchanged Hairline kernel and its MIT license are in `public/assets/hairline/`. Generated `.mjs` files adapt only figure registration to ES modules.

The `hairline-*.html` files are self-contained interactive source previews on Hairline's unchanged validation bench. `*-look.png`, `*-blind.png` and `*-motion.png` record the skill's visual checks. Brand recoloring happens in the website wrapper and SVG exports, not in the figure engine or validation bench.

## Checks

All three pass the skill validator and look runner: rest/answer, 240px thumbnails, intensity extremes, both bench themes, geometry bounds, read-outs, settled motion and clean consoles. Visually inspected silhouettes, opaque occlusion, rounded contours, movement sequence and text-free geometry. Fixed rest-pose hit tests prevent hover feedback loops. Each figure uses the kernel's discrete 700ms easing and distance stagger, with drawing skipped once settled. Rules emphasized: 01, 02, 03, 05, 06, 07, 08 and 09.

`node scripts/infrastructure-figures-check.mjs` checks Chromium and WebKit at 1600px and 1200px: all three replacements, pointer responses, settling, frame bounds, menu remount and reduced motion. Screenshots are saved here. TypeScript and targeted ESLint checks also pass.

## Edit and regenerate

Edit the corresponding figure `.js`, then run the installed Hairline `look.mjs` from this directory:

- `server-modules.js --answer 0,19,56 --edge 4,19,76`
- `test-bench.js --answer 0,-20,31 --edge 34,20,17`
- `precision-assembly.js --answer 0,0,45 --edge 4,-4,75`

After passing and inspecting the sheets, run `node docs/design/infrastructure-hairline/export.mjs` from the website root to regenerate the branded SVGs and module wrappers.

Hairline: https://hairline.lucasmarkes.com/skills
