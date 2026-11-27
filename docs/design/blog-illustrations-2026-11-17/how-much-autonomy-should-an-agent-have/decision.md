# How much autonomy should an agent have? — freedom within limits

The abstract concept is a sphere with room to move inside a defined open volume. The enclosure is a genuine twelve-edge wireframe built from eight shared vertices, not an opaque box or an incomplete front-only drawing. The sphere is real 3D geometry with equal orthogonal radii.

## Targeted projection correction

Independent review found that the earlier sphere, although physically clear of the frame, overlapped the foreground frame corner in the neutral projection. That made it appear attached to the boundary. The corrected center is `[-28, -10, 23]` with radius `27`. It retains world clearances of 20, 43 and 20 units along X, Y and Z, respectively, while leaving visible screen-space separation from foreground frame lines.

A candidate using radius 30 still crossed a foreground edge in the back view, so the final radius was chosen against all four prescribed orientations. New assertions project the actual frame edges and sphere center into each view, isolate each edge's foreground portion, and measure its closest screen-space approach. Every foreground edge stays more than 5 projected world units from the sphere silhouette; the minimum is about 5.53. No foreground corner or edge touches or crosses the sphere in the reviewed views.

## Geometry and visual review

Rerendered and inspected all eight neutral, oblique, back and underside exports in Dark and Light. The sphere now reads as separate from the foreground corner in the neutral and back views, with clear space for movement. Lines behind the solid sphere are correctly occluded; the frame remains complete with three shared edges meeting at each of its eight vertices. Oblique and underside views retain genuine volume and a spherical silhouette. No missing frame edges, duplicate strokes, world intersections, foreground tangencies or highlight bleed was observed.

The recipe verifies all twelve unique axis-aligned frame edges, correct vertex degree, absence of opaque cage panels, equal sphere radii, orthogonal axes, minimum physical clearances and projected foreground clearance in every review orientation. All eight mechanical checks and the expanded recipe assertions pass.

The user-approved abstract concept and palette direction remain intact. Original-renderer Iris review files approve geometry; the root agent applies Paper/Cream, the approved background, 1.6-unit lines and 4:3 direct SVG framing. No shared runtime, export files or content maps were changed in this targeted correction. Earlier literal dial and v3 page evidence are historical. Static illustration only; no motion testing was requested.
