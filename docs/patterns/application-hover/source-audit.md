# Applications hover source audit

Read-only inspection of Figma file`pLyUMYhdCUYzwz0UXPtGY8`, page`39:4543`, on2026-10-26. The user identifies the illustrated ServiceAgent treatment as a **hover state**; this clarifies the intended interaction beyond the component metadata.

## What the original defines

The [Applications component set`260:7419`](https://www.figma.com/design/pLyUMYhdCUYzwz0UXPtGY8/AtomsAI---Website?node-id=260-7419) exposes only `Variant=A|B`.

- `260:7418`, Variant A: the four352×352 circles shown on the homepage. Only ServiceAgent contains a pattern.
- `260:7417`, Variant B: an alternative section composition, not an idle/hover variant. It contains no circle or pattern nodes.
- Homepage instance`260:7420` uses Variant A. Its only recorded overrides are width/height.
- Variant A and its circle/icon descendants have no hover, mouse-enter, change-to or animation reactions. Its four Explore buttons have URL click actions only.
- All four Explore buttons have `State=Default` in their own component metadata. JustCall, Helpwise and CallPage use `Style=Outline`; shown ServiceAgent uses `Style=Primary`. These are the measured visual treatments, not an encoded state machine.
- No separate hover duration, easing, scale, translation or reveal effect is specified in this component.

The source therefore supports the shown ServiceAgent appearance. The user's instruction establishes that this appearance should activate on hover. Extending that behavior to all four applications, choosing the other three pattern assignments, and choosing GSAP transitions are implementation decisions.

## Exact circles and icon sources

All four icons are96×96, placed at(128,128.00001525878906) in352×352.0000305175781 circles.

| Application | Circle node | Selected icon instance | Original icon component | Dot count |
| --- | --- | --- | --- | --- |
| JustCall | `260:7292` | `298:10342` | `266:6308` — JC1 Voicewave | 23 |
| Helpwise | `260:7298` | `298:10401` | `266:6746` — HW3 Joined threads | 18 |
| ServiceAgent | `260:7304` | `298:10442` | `266:6895` — SA1 Dispatch hub | 19 |
| CallPage | `260:7311` | `302:10683` | `266:7163` — CP1 Direct call | 23 |

The original icon components are standalone components with no state properties or reactions. Their80×80 source geometry is scaled uniformly to96×96 in the circles.

All four unmodified icon masters use Theme `foreground`, variable`VariableID:5:23`, resolving to original Display P3 RGBA:

`[0.15294118225574493, 0.26274511218070984, 0.23137255012989044, 1]`.

This supports a dark idle ServiceAgent icon from its own master. The displayed ServiceAgent instance overrides all19 dot fills—`I298:10442;266:6897` through`I298:10442;266:6915`—to Palette `forest/cream`, variable`VariableID:5:10`:

`[0.9647058844566345, 0.9450980424880981, 0.9098039269447327, 1]`.

Its cream icon is an explicit source override, not a global theme change. The other three selected instances retain their masters' foreground binding. Applying the same cream treatment to their hover states extrapolates the measured ServiceAgent treatment.

All circle backgrounds resolve from Neutral Light `background` (`VariableID:5:22`) to:

`[0.9803921580314636, 0.9803921580314636, 0.9803921580314636, 1]`.

The three idle circles use a1px forest border at alpha`0.10000000149011612`, bound to `VariableID:5:25`. The shown ServiceAgent circle uses a1px forest border at alpha`0.05000000074505806`, bound to `VariableID:195:2939` (`border-subtle`). Circles clip their contents and use radius9999.

## Source pattern assignment and palette

Only ServiceAgent has a measured application-specific pattern assignment: instance`260:7305` of legacy master`205:12049`, Concentric with15 rings. It fills the circle at352.000061×352.000061, positioned approximately(0,0); the source's exact offset is(−0.00006103515625,−0.00006103515625).

Its original Display P3 palette is:

| Role | RGBA |
| --- | --- |
| Base, reflection-base | `[0.2862745225429535, 0.24705882370471954, 0.3450980484485626, 1]` |
| Upper/lower field, reflection | `[0.5490196347236633, 0.47058823704719543, 0.6901960968971252, 1]` |
| Highlight | `[0.8470588326454163, 0.8039215803146362, 0.8980392217636108, 1]` |

The reflection parent uses LINEAR_DODGE with the nonblack reflection-base above. Exact field, mask and crop measurements are retained in [homepage-source.json](../homepage-source.json), application`applications-concentric`.

A scan of pattern-named nodes and their ancestor paths across the Exploration page found no separate pattern assignment for the JustCall, Helpwise or CallPage circles. Other nodes under general “Applications” labels are offerings cards, technology previews or the closing CTA, not assignments to these four product circles. The original icon alternatives likewise do not encode pattern assignments.

## Implementation decisions to label honestly

The following are authorized by the user's requested interaction but cannot be described as measured Figma values:

- Which distinct family/count/palette to use for JustCall, Helpwise and CallPage.
- The idle state of the whole section with all four patterns hidden; this follows the user's hover-state clarification and the other three shown idle circles.
- Reusing the measured cream-icon/primary-button treatment across all four hovered or keyboard-focused cards.
- GSAP duration, easing, reveal technique, icon movement or scale, interruption handling, and reduced-motion behavior.

The source does **not** support leaving ServiceAgent permanently selected merely because Variant A happens to display it highlighted. The user's explicit hover-state clarification supplies that missing interaction meaning.

