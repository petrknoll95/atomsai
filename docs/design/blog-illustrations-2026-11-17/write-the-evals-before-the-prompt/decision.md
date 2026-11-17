# Write the evals before the prompt

The article explains that the evaluation checklist is the specification, established before the system is built. A recognizable clipboard carries three check boxes, two checkmarks and three blank rules. It contains no words or fabricated measurements. This replaces the earlier sphere and gauge with an immediately recognizable object.

## Construction

The board is a complete 108 × 156 × 8 solid. A 92 × 134 × 0.8 sheet rests exactly on its front face, inset around all edges. The top clamp's back contacts the paper; two mounting feet attach to exposed board above the paper and share the clamp's upper edge. A wire handle terminates on the clamp's front face. The whole object is rigidly posed by 20 degrees around its vertical axis, retaining a consistent orthographic perspective and visible board thickness.

Only the first printed checkbox is highlighted. It is separated from the clamp by 16 units and carries an outward face normal. This avoids painting a broad paper highlight over the clip in oblique views, and the highlight disappears on rear views. All marks occupy the paper's physical front plane with tiny rendering offsets.

## Review

Read the complete original article in `src/content/blog/bodies.json`. Used the requested current scene renderer and geometry primitives; `built-in-your-stack` provides framing only. The root agent applies the retained background palette, Paper/Cream gradient and thinner 1.6-unit final linework.

Inspected all eight original-renderer views in Dark and Light. The neutral view reads clearly as a clipboard with a checklist, rather than a flat icon. Oblique and underside views show the board and sheet thickness, connected clamp and handle, and markings that remain on the sheet. The back view correctly shows the bare rear board, with no checks or highlight bleeding through. The selected region stays clear of clip geometry. Three boxes and exactly two checkmarks remain visible on the front; no duplicate strokes, exposed mesh, impossible overlaps, detached clip pieces or text were observed.

Concept assertions check board front/back, paper contact, clamp contact, mounting-foot attachment, handle endpoints, row spacing, checkmark count and the highlight's separation from the clip. All eight renderer checks pass. Parent integration handles final recoloring and page review. No animation or interactive gallery testing was requested.
