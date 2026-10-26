# Vector artwork

Homepage logos, wordmarks, icons, and other artwork with vector source should use SVG. Preserve the original geometry and colors; do not wrap raster images in SVG or trace an available vector original. Photographs and supplied raster product imagery can retain appropriate raster formats.

## Northwind Logistics

- Source: Figma file `pLyUMYhdCUYzwz0UXPtGY8`, node `202:11800` (`Company`), exported as SVG on 2026-10-26.
- Runtime asset: `public/assets/figma/stories-Company.svg`, replacing the former PNG reference in `src/components/home/stories.tsx`.
- The original export includes unrelated ancestor page backgrounds. Only the `Company` group is retained in the original `0 0 184 32` viewBox. Its three paths, outlined letterforms, and Display P3 fills are unchanged. The result is transparent vector artwork without embedded raster images or font dependencies.
- Existing CSS display dimensions, layout, and accessible name remain unchanged. The old PNG is retained only as historical source/comparison evidence.
- Audit: other homepage logo and icon assets already use SVG. Remaining raster content consists of photography and the supplied product screenshot used within the property-advisor illustration; pattern reference PNGs are comparison evidence, not homepage patterns.
