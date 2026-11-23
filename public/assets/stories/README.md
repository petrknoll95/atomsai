# Customer story imagery

## Homepage carousel

The current homepage uses generated editorial photography to illustrate each customer's industry. The images depict generic work settings and are stored as 480×640 and 960×1280 WebP files.

| Local asset prefix | Image generation subject |
| --- | --- |
| `pinegrove-property` | A cream-painted house with a dark sage door, seen through leafy garden shadows |
| `brightline-plumbing` | A plumber's hands and a small wrench beside copper pipes below a utility sink |
| `kestrel-freight` | An unbranded white freight tractor and trailer at a quiet distribution yard |

Each image was generated with the built-in image tool using a portrait editorial composition, natural daylight, warm neutrals and restrained forest greens, subtle analog grain, and realistic materials. The scenes avoid lettering, logos, and identifiable faces.

## Earlier demo portraits

Selected 28 October 2026 from free Unsplash photo pages under the [Unsplash License](https://unsplash.com/license). These seated studio portraits were used in an earlier demo carousel.

| Local asset prefix | Photographer / contributor | Original photo |
| --- | --- | --- |
| `abigail-boone` | Abigail Boone | [Woman with long white hair seated on a stool](https://unsplash.com/photos/a-woman-with-long-white-hair-sitting-on-a-stool-LpPlJjqSeVA) |
| `brauer` | M. Brauer | [Man seated on a stool](https://unsplash.com/photos/a-man-sitting-on-a-stool-with-his-legs-crossed-ozF6-uMVgN4) |
| `ageing-better` | Centre for Ageing Better | [Woman in beige jumpsuit, seated on a stool](https://unsplash.com/photos/woman-in-beige-jumpsuit-smiling-sitting-on-a-stool-IxacjtwPdGM) |

All three are cropped to 3:4 and encoded as WebP at quality 83, in 480×640 and 960×1280 variants. Abigail Boone and Ageing Better use top-aligned crops to preserve headroom; Brauer uses a centered crop. No generated backgrounds, retouching, or color changes are applied.

The carousel preloads the local responsive files within 600px of the viewport and decodes the next portrait before its eight-column reveal. No Unsplash requests occur at runtime.

The older demo paired these photographs with fictional quotes and results. The subjects did not represent customer endorsements.
