# Full-screen menu resolution

The animated card preset capped its longest output edge at 1024px. The menu's slit-aligned field is about 2387 CSS px wide at the desktop reference, so the browser enlarged a 1024 × 412 canvas. This caused low-resolution edges.

The menu now opts into `MotionPattern resolution="display"`. Other motion placements keep the existing balanced preset. The display preset follows device pixel ratio up to 2, with a 12-million-output-pixel budget, 6144px edge cap and GPU limits. At a 1600 × 960 viewport and DPR 2, the underlying menu field now renders at **4774 × 1920**.

For stretch-fit linear patterns, intermediate masks are rectangular, matching the field's aspect ratio. Their total area is capped at the existing 2048² maximum, retaining at most 64 MiB for the pair of float16 masks. At the reference viewport they measure **3229 × 1298**, versus the old **1076 × 1076**. Vertical blur sampling accounts for this aspect ratio. Preparation happens once per size/configuration change; animation reuses the textures at its existing 30fps target. Closing the menu releases them. The underlying pattern geometry, slit alignment and tonal animation are retained.

Run `node scripts/menu-resolution-check.mjs` against a fresh production build/server on port 3001. The script captures Chromium/WebKit at DPR 2, checks actual canvas dimensions and mask memory, verifies cached animation and mobile resize, and checks cleanup on close. For a controlled old-budget comparison it intercepts the local application bundle in one isolated test page and changes only the menu's resolution prop back to balanced. It does not edit production files. Both captures use reduced motion to match phase zero.

`edge-before-after.png` shows the same slit edge, old budget on the left and display resolution on the right, enlarged with nearest-neighbor sampling. Full reference images and measured dimensions are in this directory. The shader intentionally contains soft gradients; this change removes undersampling rather than replacing those gradients with hard bands.
