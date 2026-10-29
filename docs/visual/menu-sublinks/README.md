# Two-column fullscreen navigation

Applications, Infrastructure and Industries now show their existing sublinks
in the second column, aligned to the adjacent shader slit. Applications opens by default. Parent destinations
remain available as All Applications / All Industries; Explore PyAI already
provides the infrastructure destination. AI Services and Company remain direct
links. The duplicate product sidebar and body contact button have been removed.
Talk to AtomsAI remains beside the close control at the same header breakpoints. Terms of
Service and Privacy Policy use the existing footer destinations, with small
text links at the bottom of the first slit column. On short screens the menu
scrolls naturally so these links remain reachable.

The active cream dot stays on the column edge while its label shifts right;
sublinks remain on the next column boundary. Main labels scale with the slit column width up to 64px, reserving space
for the active dot indent and column gutter. Vertical padding is 10px per side;
controls retain a minimum 44px hit area. Both columns remain visible on phones. Inactive
labels are muted. Panels crossfade over 300ms, with 35ms staggered link reveals;
primary rows stay stationary. Hover opens a
group on fine-pointer devices; touch and keyboard toggle it. Reflow alone cannot
select another group under a stationary cursor. A first click confirms a group
just opened by hover; subsequent clicks toggle it.

A pointer moving right through the triangle between the selected main link and
the submenu’s near corners keeps the current group selected. Stopping over a
crossed row for 350ms selects that row; moving vertically or away from the
submenu switches immediately. Entering the submenu, leaving the navigation,
clicking, keyboard input, and closing cancel pending hover changes. The main
link highlight follows the accepted selection, so crossed rows do not flash.

Collapsed panels are inert and excluded from the custom focus boundary. Reduced
motion resolves transitions immediately. Existing modal focus restoration,
background scroll locking, slit artwork and section-link navigation are retained.

With the preview running on port 3001:

```sh
node scripts/menu-pointer-check.mjs
node scripts/menu-sublinks-check.mjs
node scripts/fullscreen-menu-check.mjs
```

The menu checks cover Chromium and WebKit at 1440×960, 390×844, 320×568,
and 568×320. They sample intermediate panel opacity, check stationary rows and rapid reversals,
hover/click/touch/keyboard operation, adjacent-slit alignment, collapsed inertness,
focus wrapping, reduced motion, and section-link navigation. Screenshots show
keyboard focus intentionally; that outline is not a permanent menu border.

The pointer checks exercise slow upward and downward diagonal paths, direct
vertical switching, stationary hover, and keyboard cancellation in Chromium
and WebKit at 1440px and 1024px widths.
