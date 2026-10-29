# Hairline hover illustrations

Built with `/Users/petrknoll/.codex/skills/hairline-create/SKILL.md` using the unchanged kernel and bench.

- Applications: a rounded solid core inside an open cubic cage of rounded frames. Hover opens the cage outward, staggered by distance from the selected frame.
- Models & infrastructure: an opaque rounded plate between two dashed model planes. Hover increases the separation with a distance-based stagger.
- Both use the default 700ms Hairline tween, fixed rest-pose hit regions, bounded travel, and registered loops that sleep after settling. Both homepage and header mount the same exported modules.

## Twelve-question visual review

Reviewed the generated look sheets and motion sheets in light/dark themes, at 240px, and at both intensity endpoints.

1. Yes — the inner cube/open cage and the solid plate/dashed planes read at thumbnail size.
2. Yes — the nested and separated rest compositions identify each object; the central solid carries the rest accent.
3. Yes — frame movement spreads by 45ms per distance step; plane separation by 50ms.
4. Yes — the automatic stillness checks pass; fixed hit regions do not chase animated geometry.
5. Yes — the core and plate use rings/prism/solid/put; the open cage uses rounded rectangle frames. Creases are subordinate to silhouettes.
6. Yes — the opaque central solids hide rear geometry. Front cage wires remain visible in front of the core; they are open frames, not solid faces.
7. Yes — the accent moves from the central solid at rest to the selected frame or layer.
8. Yes — rest, frame number, and layer number read-outs match the hover targets.
9. Yes — both full travel endpoints remain inside the 400 × 320 frame. Rest coverage: cube 32%, planes 33%.
10. Yes — both themes preserve the object and its hierarchy.
11. Yes — there are no words or icons inside either SVG.
12. Yes — both look runs report clean consoles and pass validation.

Self-contained previews: `hairline-nested-cube.html` and `hairline-layered-planes.html`.
