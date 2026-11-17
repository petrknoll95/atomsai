---
name: atoms-blog-art
description: Generate and iteratively review original raster editorial covers for AtomsAI articles using image_gen, the brand palette, and visual reference comparisons. Use for blog cover art and coordinated image sets.
---

# AtomsAI editorial cover images

Use the built-in **image_gen** tool for original raster artwork. Never substitute SVG illustration, hand-coded shapes, CSS gradients, canvas drawing, Quiver or a diagram. If image_gen is unavailable, report the limitation instead of silently switching. Sharp is for export and QA previews only.

## Start with sources

Read the actual article body. If only a title/summary exist, use them and record that limitation; do not invent a body. Inspect actual image proportions, badges, desktop/mobile and filters. Read current project palette tokens; [palette.md](references/palette.md) records the verified sRGB anchors.

Study high-resolution abstract covers at [Superhuman's blog](https://blog.superhuman.com/) before establishing a new direction. Start with the direct image links in [reference-study.md](references/reference-study.md); the homepage also includes unrelated photography/UI, so do not spend time hunting through archives. Relevant qualities: crisp large silhouettes, expressive optical gradients, selective material texture, controlled shallow depth and purposeful overlap/cropping. Photography/text-heavy covers are outside this brief. References set a finish benchmark; do not copy compositions or reuse their assets.

## Art direction

Use the article to choose an editorial association: compression, continuity, handoff, alignment, a boundary or a change of state. Write a plain sentence linking the art to the source. Do not let a literal spatial metaphor become a simplistic diagram. Abstract art need not explain every technical detail. Judge the designed image as a whole.

The target is FLAT EDITORIAL GRAPHIC COLLAGE. Compose hierarchy across large silhouettes, medium counterpoints and fine detail. Use unequal scale, staggered overlaps, deliberate off-frame continuation, translucent intersections and asymmetrical rhythm. Juxtapose different surface treatments: a quiet gradient, one sharply masked optical texture, a controlled fine pattern and a calm solid. Selective softness can separate layers; it must not become the style of every surface.

Small dots, short hatch marks and a fine background arc are part of the reference vocabulary. Keep them precise, sparse in coverage and low in contrast. Concentrate a pattern in one limited region. Do not spread multiple competing patterns over the biggest shapes. Avoid scratchy irregular strokes and conspicuous decorative orbital paths. No generated words, glyphs, logos, watermarks, UI or literal charts.

Use optical texture as pigment inside flat masks, not literal swimming-pool water, physical corrugated material, fabric, a sculpted sphere or a glossy 3D product. Keep selective shallow shadows subtle. Reject all-over haze, dusty grain, satin ribbons, giant smooth blobs and generic gradient wallpapers. The earlier user-rejected direction made precisely these mistakes.

Forest/cream anchors the series with Iris accents. Natural shading is welcome; every pixel need not match a hex. Judge perceptual color families and area balance. Avoid blue/cyan or magenta drift, yellowed cream and muddy grey. Do not mix the separate warm accent family with Iris.

Vary silhouettes, backgrounds, direction and relationships across articles. Do not make every concept a circle, beam, flowing ribbon or floating card. Share finish, not composition.

## Pilot evidence and failed assumptions

Inspect the original Superhuman references AND these current candidates:
- [phone-audio.webp](references/examples/phone-audio.webp): unequal overlapping planes, fine hatch material, a smaller optical-texture counterpoint and forest atmosphere. Earlier realistic caustics, heavy shadow and scratchy marks were reduced.
- [company.webp](references/examples/company.webp): cream field, different surface treatments, translucent intersections and deliberate cropped geometry. Earlier oversized hatch coverage and three strong arcs were removed to restore hierarchy.

These are current comparison candidates, not user approval or proof of professional parity. Do not copy their layouts across the series. The initial SVG direction and later smooth ribbon/landscape raster pilots were explicitly rejected by the user. Technical crop success and AI reviewers calling those usable did not meet the aesthetic benchmark.

The failed constraints were banning fine marks, treating minimalism as very few shapes, forcing every cover into one literal mechanism and smoothing away material contrast. Never reintroduce that recipe. Compare against the references, not only against an earlier weak attempt.

## Generate and revise

For a new cover call image_gen with an original-image prompt, omitting reference-image arguments. For targeted edits inspect inputs first, use referenced_image_paths, and distinguish target from finish reference. When fidelity is weak, include the ACTUAL reference image alongside the target; text descriptions alone repeatedly flattened the style. State that composition must remain original. Never supply both reference mechanisms. Return the native generated image as the tool requires; copy its source while preserving the original.

Prompt structure:
1. Real article meaning and its editorial association.
2. Concrete composition: hierarchy, unequal scales, asymmetrical relationships and focal event.
3. Palette hex anchors and area hierarchy.
4. Finish: flat crisp silhouettes, contrasting surface treatments, precise restrained micro-pattern, selective optical detail and shallow light.
5. Landscape 16:9, central-square-safe focal relationship, no text/labels.
6. Exclusions relevant to that concept.

Do not rigidly prescribe tiny object counts or empty-space percentages. Specify what the eye should understand first. Important relationships must survive the central 56% of image width because covers also appear square. Keep lower-left calm for a category badge.

Inspect actual output at full size and 320x180 / 256x256 center-crop previews using [qa.md](references/qa.md). State an observed defect before revising: e.g. square crop loses the cutoff, grain muddies green, or the geometry reads as a landscape. Edit with image_gen; change composition if the metaphor failed. Do not disguise failure through programmatic recoloring/drawing. Reinspect every revision.

For a new series, establish two contrasting pilots before expanding. Test fresh subagents with this skill, article source and output directory without prescribing motifs. They must actually call image_gen. Independently review actual images, update instructions for observed recurring failures, and never present self-assigned quality scores as proof.

## Files and integration

Retain PNG masters, exact prompts, revision reasons, tool output paths and selection decisions in project design evidence. Rejected candidates must not enter served assets. Export selected masters with:
`node <skill>/scripts/prepare-cover.mjs source.png output-stem`
Run from a project with Sharp installed. This produces opaque 1600x900 sRGB WebP and wide/square previews; it performs no creative edits. Inspect after compression. Keep the PNG master separately.

Use explicit title/slug maps, not position-based image arrays. Preserve copy/layout. Check every article placement, related cards, filters, responsive crops, loading and image decoding. Run relevant project checks. Distinguish local preview from remote staging and report the URL actually verified.

Deliver skill, assets, prompts/revision evidence and verification. Independent AI critique does not replace human art-direction review. If no human designer was available, aesthetic validation remains provisional. Technical tests cannot prove artistry.
