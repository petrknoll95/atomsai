# Construction and primitive contract

The recipe receives the exports of `runtime/geometry.mjs` and `runtime/primitives.mjs` as its `api` argument. These are generated from the live implementation. Do not modify the runtime files: they are hash checked.

## Plan the object before drawing

Decide the primitive count, real dimensions, centers, axes and relationships before choosing a pose. Identify which surfaces occlude others, which are wire-only, which single part receives Iris, and whether hidden edges are translucent or omitted. Use the nearest reference's framing. Start sparse; extra rays, nodes or grids require meaning.

For a different model pose use `transformScene(scene, pointTransform, vectorTransform)`. Both transformations must be rigid rotations; direction vectors must not receive translation. `fromView` is valid for posing a genuinely planar diagram or choosing a physical axis. It is not a way to invent depth for traced pixels.

## Common constructors

| API | Important behavior |
| --- | --- |
| `scene()` | Empty shared scene. Return this from the recipe. |
| `plane(s, center, u, v, width, height, highlight?, dash?, holeSize?, holeCenter?)` | Two perpendicular unit axes. Creates four boundary edges and an occluding sheet. Optional rectangular hole removes occlusion and color inside its boundary. Returns points/hole/owner. |
| `ring(s, center, radius, u, v, options?)` | Physical circular hoop. `surface:true` makes the enclosed disk an occluder; it does **not** create an annular hole. `highlight:true` creates a radial disk fill. |
| `tube(s, center, outerRadius, innerRadius, thickness, u, v, highlight?)` | Complete hollow cylinder with inner/outer walls and annular caps. Center is the first cap; thickness extends along `cross(u,v)` (X/Z therefore extends down −Y). Highlight=true highlights the entire solid. See the ring recipe for only the top annulus. |
| `box(s, center, [w,h,d], options?)` | Eight shared vertices, six faces, twelve edges. `grid:true` divides all six faces. `wire:true` omits occluding faces but retains outward-normal edge filtering; it does not mean every rear edge is drawn. Returns vertices/faces/owner. |
| `ellipsoid(s, center, [axisA,axisB,axisC], options?)` | Axis-vector lengths are radii. Orthogonal equal axes make a sphere. `half:true` creates a hemisphere; `wire:true` omits depth faces. The renderer computes apparent contours for each angle. |
| `curve(s, start, controlA, controlB, end)` | Cubic curve; derive endpoints from the actual receiving geometry, not approximate screen positions. |
| `stroke(s, points, options?)` | Intentional linework only. Do not add triangle/quad mesh edges. |
| `arrow(s, start, end, size?, planeNormal?)` | Default is a camera-facing arrowhead on a 3D shaft. Supply planeNormal when the entire arrow must stay in a physical diagram plane. |

`X`, `Y`, `Z` are unit axes. `add`, `sub`, `mul`, `dot`, `cross`, `unit`, `around`, `circlePoints` and `transformScene` support construction. Use `verify` assertions on raw geometry before fitting. Avoid referring to emitted path indices when face/vertex data or explicit geometry is available.

## Highlight one face of a box

```js
const cube = box(s, [0, 0, 0], [80, 80, 80], { grid: true });
s.hiddenLines = 'omit';
const face = cube.faces.find(f => f.normal[0] > .99);
s.highlights.push({
  points: face.points, normal: face.normal,
  kind: 'diamond', gradient: [],
});
```

Do not add a second plane on top of an existing face: duplicate surfaces/edges create seams. An outward normal is needed for a one-sided opaque highlight. Whole-solid highlights use the primitive's highlight option instead.

## Framing a new concept

Choose a current gallery `reference` in the recipe. The runner calls the same fitting function used by the site, using that reference's neutral occupancy and aspect ratio, then sets stroke width to 1.28. It also applies the same rotation bounds safeguard as the canvas. Do not copy a fitting formula, scale the SVG after export, or apply this fit twice.

This solves the missing-reference problem during exploration: a new scene does not need a fabricated SVG or metrics entry to be rendered and reviewed. Final gallery registration happens only after the design is selected; see `integration.md`.
