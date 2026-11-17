# The reminder went out. The chair stayed empty.

Selected concept: one unmistakable empty chair, with its vacant seat as the only highlighted surface. This directly depicts the article's empty appointment chair. No token, calendar icon or decorative element is needed. The previous abstract aperture recipe is retained in `recipe.aperture-rejected.mjs`.

Source: https://atomsai.com/resources/blog/no-shows; the imported article explains why reminders leave seats empty and how confirmation and rebooking keep appointments.

Geometry: a 110 × 100 seat, two front legs, two rear legs continuing into back posts, and a top back rail. All four feet meet one floor. Front legs end exactly at the seat underside; rear posts pass through the seat as mortised joints and end at the back rail underside. The back is an open structural frame so the empty seat stays visible from either side. Every component is a complete solid; there are no detached legs or flat icon approximations.

Revision during review: a broad solid back exposed a shared-renderer limitation: highlight polygons are not depth-clipped against other opaque parts. Replaced the broad back with a physically valid open frame. This removes the large color-through-panel defect and keeps the recognizable chair. The renderer still draws color independently of thin frame contours, which is its supplied surface treatment; no runtime or SVG patch was made.

Validation: all eight export checks pass, and the complete contact sheet was inspected in Dark and Light. Neutral and oblique views clearly read as a chair. The rear view shows the actual open back; underside removes the upward-facing seat highlight. Four floor contacts, attached seat, shared back joints and consistent thicknesses remain valid under rotation. Assertions check all six complete solids, four feet, front leg attachments, rear mortised joints and the back rail connections.

Parent integration applies the approved colored field, Paper outline, Cream highlight and thinner stroke while preserving SVG and 4:3 placement. Diagnostic review files retain the skill palette. Selected geometric master: `review/neutral-dark.svg`.
