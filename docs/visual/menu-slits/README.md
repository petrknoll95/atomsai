# Menu slit alignment

The menu reuses the original Drift shader in its dark mode with the approved Light Tide animation. It mounts only while the menu is open and disposes its renderer on close. Reduced motion renders a still frame. A 38% forest-shade veil and 80% cream secondary text maintain readability.

The background and navigation share a three-column grid on desktop and a two-column grid below 768px. Main navigation spans two tracks; supporting content starts on the third desktop track. On mobile, the product links occupy the two tracks. The logo and outer controls align to the same grid's outer boundaries. Desktop main links retain a page-gutter separation before the supporting column.

The source shader repeats slits over 840 units, then crops the central 800 units. The rendered field therefore uses `track × (columns + 2) × 800 / 840` width, centered on the content. Two overflow slits carry the pattern beyond both gutters. This puts each visible boundary on a content track, without guessing offsets from screenshots. All of these layout assignments are implementation decisions for the requested menu; the pattern's underlying geometry and palette remain from the existing Figma-derived source.

Run `node scripts/menu-slits-check.mjs` against the production server at port 3001. It checks original shader boundary coordinates against the rendered logo, primary navigation, supporting content and product link origins at 1920, 1600, 1280, 1024, 768, 390 and 320px in Chromium and WebKit. Maximum measured alignment error was under 0.24 CSS px, due to fractional layout rounding. No horizontal overflow or clipped primary links was detected. It also verifies reduced-motion rendering, active animation, Escape/focus restoration and removal of the shader on close.

`results.json` contains the measured geometry. `chromium-1600.png`, `webkit-1600.png`, `chromium-390.png` and `webkit-390.png` show the integrated menu. The production build, type check performed by the build, and lint of the changed component passed.
