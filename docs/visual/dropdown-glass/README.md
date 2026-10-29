# Glass product previews

The dropdown's four product previews use the existing dark-green pattern renderer and palette. JustCall uses three drift slits; Helpwise uses five drift slits rotated 180 degrees; ServiceAgent uses three single-band slits; CallPage uses eight offset slits. These are configurations chosen for this user-requested treatment, not original Figma values.

Micro-UI containers use cream at 12% opacity with 16px backdrop blur. Small controls use cream at 16%; action capsules also use 8px blur. Container borders and edge shadows are removed. Original icon geometry remains in use through monochrome masks.

One shared shader canvas updates with the selected product. It uses the existing light-tide motion, capped at 30fps, and stops/disposes with the dropdown. Reduced motion shows a still pattern. A dark-green fallback remains if the canvas is unavailable.

Run `node scripts/dropdown-glass-check.mjs` with the development server on port 3001 to reproduce all four previews in Chromium and WebKit and validate blur, border removal, distinct configurations, a single canvas, motion, teardown, and browser errors. Captures and checks are in this directory.
