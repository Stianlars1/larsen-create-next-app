# Palette contracts

Current package-only reference for `palette/index.js` and generated
`theme.css`. The deterministic fixture in
`create-next-app/test/palette-contract.test.mjs` and
`create-next-app/test/neutral-tint.test.mjs` run the public generator for both
neutral tints across all 18 preset-format combinations.

This document does not describe a product site or Rampkit preview.
`palette/NOTICE.md` owns vendored source provenance and local deviations.

## Current matrix

The matrix uses seed `#4DA0FF` with both `subtle` and `strong` neutral tints.
The light root and explicit-light blocks match each other. The automatic and
explicit dark blocks match each other. shadcn's structural `--radius` is
declared in the light/root contract and inherited by dark mode; every color
name exists in both modes.

| Preset | Format | Light names | Dark names | Opaque syntax | Alpha syntax |
| --- | --- | ---: | ---: | --- | --- |
| shadcn | hex | 82 | 81 | checked | not emitted |
| shadcn | rgb | 82 | 81 | checked | not emitted |
| shadcn | hsl | 82 | 81 | checked | not emitted |
| shadcn | hsl-values | 82 | 81 | checked | not emitted |
| shadcn | oklab | 82 | 81 | checked | not emitted |
| shadcn | oklch | 82 | 81 | checked | not emitted |
| radix | hex | 83 | 83 | checked | checked |
| radix | rgb | 83 | 83 | checked | checked |
| radix | hsl | 83 | 83 | checked | checked |
| radix | hsl-values | 83 | 83 | checked | checked |
| radix | oklab | 83 | 83 | checked | checked |
| radix | oklch | 83 | 83 | checked | checked |
| css-variables | hex | 50 | 50 | checked | not emitted |
| css-variables | rgb | 50 | 50 | checked | not emitted |
| css-variables | hsl | 50 | 50 | checked | not emitted |
| css-variables | hsl-values | 50 | 50 | checked | not emitted |
| css-variables | oklab | 50 | 50 | checked | not emitted |
| css-variables | oklch | 50 | 50 | checked | not emitted |

Radix Themes and CSS Variables are distinct declaration contracts in every
format. The generated file header also names the selected preset, format, and
neutral tint.

## Neutral tint

The public choices are `subtle` and `strong`:

- `subtle` selects the neutral ramp previously produced by analogous,
  complementary, and triadic, which were byte-identical to each other.
- `strong` selects the neutral ramp previously produced by monochromatic.

The mapping itself preserves the former output. The 0.5.0 `--input` correction
is a separate deliberate accessibility fix and applies to `shadcn` under both
tints. The 0.5.0 hue-360 correction changes the complete palette in every
preset and format for affected seeds, rather than only a shadcn declaration.

The wrapper maps those names privately to existing vendored engine paths. It
does not rotate the requested seed or rebuild the accent palette around
another hue. `palette/NOTICE.md` records the engine's local deviations,
including the separate hue and foreground-subtle corrections. The generated `--analogous`,
`--analogous-foreground`, `--complementary`, and
`--complementary-foreground` support tokens and their chart mappings remain
available under both choices.

### Exactly what moves

Measured across a 233-seed sweep of hue, saturation, and lightness, in
`shadcn` x `hsl-values`, both modes:

| Group | Tokens that can differ between `subtle` and `strong` |
| --- | --- |
| Gray ramp | `--gray-1` through `--gray-12` |
| Derived from the gray ramp or its final surfaces | `--foreground`, `--foreground-subtle`, `--muted`, `--muted-foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--border`, `--input`, `--secondary`, `--accent`, `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`, `--primary`, `--primary-foreground`, `--ring`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-ring`, `--analogous-foreground`, `--complementary-foreground` |
| Accent scale | unchanged for chromatic seeds; changes for the four hueless exceptions below |

`--background` and `--accent-1` through `--accent-12` remain identical under
both tints for every chromatic seed. Primary and ring are corrected against
the final card and popover surfaces, which belong to the selected gray ramp.
In the locked 762-seed corpus, two dark roles require tint-specific candidates:
`#611431` primary moves from `#72203d` under subtle to `#8c2e4e` under strong,
and `#9F46B1` ring moves from `#9f46b1` to `#e498f3`. No other primary or ring
in that corpus differs by tint. The largest single-channel difference in the
earlier gray-ramp sweep was 4 of 255, so the underlying tint remains
deliberately small even when a contrast boundary selects another scale step.

The documented exceptions have no usable hue of their own: `#000000`,
`#010101`, `#FEFEFE`, and `#FFFFFF`. The engine derives each accent scale from
the same tinted neutral. The exact changed declarations across the two
12-step mode scales are:

| Seed | Light | Dark | Total |
| --- | ---: | ---: | ---: |
| `#000000` | 9 light | 6 dark | 15 total |
| `#010101` | 0 light | 6 dark | 6 total |
| `#FEFEFE` | 9 light | 0 dark | 9 total |
| `#FFFFFF` | 9 light | 6 dark | 15 total |

`create-next-app/test/neutral-tint.test.mjs` locks these per-mode counts as
well as the chromatic-seed invariance claim.

`generateThemeCss()` defaults to `subtle`. It rejects blank or unknown neutral
tints and explicitly rejects an options object containing the removed
`scheme` property. The public constants are `NEUTRAL_TINTS`, `PRESETS`, and
`FORMATS`; `SCHEMES` is no longer exported. `darkHex` is absent only when it
is `null` or `undefined`; supplied blank, malformed, or non-string values are
rejected explicitly. Valid three- and six-digit HEX values work.

## Curated semantic status scales

Semantic statuses use full named Radix Colors scales rather than generated
hues. The original normalized seed selects the candidate with the smallest
OKLAB Delta E to the candidate's light sRGB step 9. Candidate-list order
breaks equal distances. The selected name is shared by light and dark output,
whose values come directly from that named scale. A dependency-drift test
locks that every allowed scale has the same light and dark sRGB step 9.

| Role | Candidate scales | Achromatic default |
| --- | --- | --- |
| success | jade, green, grass | green |
| danger | tomato, red, ruby, crimson | red |
| warning | amber, orange | amber |
| info | sky, blue, cyan | blue |

Seeds below 6 percent HSL saturation use the achromatic default. The selected
scale supplies base from step 9, muted from step 3, and border from step 7.
Base and muted foregrounds use the existing palette-first chooser with a 4.6
target. The named scale selection is independent of neutral tint and
mode-specific seed selection. Existing status token names remain in all
presets. In shadcn, `--destructive` and `--destructive-foreground` are
resolved aliases of the selected danger values, while chart 4 and chart 5 are
resolved aliases of warning and success.

## shadcn approved token-name contract

shadcn emits 81 color names in both modes plus root-level `--radius`:

- The approved 32-name shadcn semantic token-name contract: background,
  foreground, card, popover, primary, secondary, muted, accent, destructive,
  border, input, ring, radius, five chart names, and eight sidebar names with
  their foreground variants.
- 12-step solid accent and gray scales.
- Larsen foreground-subtle, analogous, complementary, and 20 status names.
- The legacy `--destructive-foreground` extra for projects generated by older
  package versions.

The approved derived roles are:

| Token | Light source | Dark source |
| --- | --- | --- |
| card | background | gray step 2 |
| card-foreground | foreground | foreground |
| popover | background | gray step 3 |
| popover-foreground | foreground | foreground |
| foreground-subtle | gray step 10, corrected only if needed to reach the 4.6 project target against background | gray step 10, corrected only if needed to reach the 4.6 project target against background |
| primary | requested seed when it reaches 1.5 against background, card, and popover and supports a 4.6 foreground; otherwise closest passing text-safe accent step | same rule |
| primary-foreground | scale-first chooser against corrected primary | same rule |
| ring | requested seed when it reaches 3 against background, card, and popover; otherwise closest passing accent step | same rule |
| radius | `var(--radius-md)` | inherited |
| chart-1 | accent step 9 | accent step 9 |
| chart-2 | analogous step 9 | analogous step 9 |
| chart-3 | complementary step 9 | complementary step 9 |
| chart-4 | warning base | warning base |
| chart-5 | success base | success base |
| sidebar | card | card |
| sidebar-foreground | foreground | foreground |
| sidebar-primary and foreground | primary pair | primary pair |
| sidebar-accent and foreground | accent pair | accent pair |
| sidebar-border | border | border |
| sidebar-ring | ring | ring |

Aliases are emitted as resolved color values so each mode remains
self-contained and format-consistent. `--radius` is the one structural alias.
This is a token-name and value contract, not a promise that shadcn components
work without their separate Tailwind and runtime assumptions.

## Radix Themes custom-palette override contract

The `radix` preset is labeled `Radix Themes custom-palette tokens`. It emits
83 unique names:

- The 57-name Radix Themes custom-palette override contract:
  `--color-background`, both 12-step solid scales, both 12-step alpha scales,
  and contrast, surface, indicator, and track for accent and gray.
- 26 retained Larsen names: background, foreground, four harmony names, and
  20 status names.

The exact Radix mappings are:

| Radix token | Engine source |
| --- | --- |
| color-background | Radix mode background |
| accent-1 through accent-12 | accent solid scale; step 9 resolves to the closest text-safe scale step only in the black-white crossover |
| accent-a1 through accent-a12 | accent alpha scale; step 9 follows the same source index as corrected solid step 9 |
| accent-contrast | upstream value when it reaches 4.6 against resolved accent step 9, otherwise scale-first foreground chooser |
| accent-surface | generated accent surface |
| accent-indicator and accent-track | resolved accent step 9 |
| gray-1 through gray-12 | gray solid scale; step 9 uses the same text-safe correction rule |
| gray-a1 through gray-a12 | gray alpha scale; step 9 follows the same source index as corrected solid step 9 |
| gray-contrast | foreground chooser against resolved gray step 9 |
| gray-surface | generated gray surface |
| gray-indicator and gray-track | resolved gray step 9 |

P3 wide-gamut blocks are deliberately deferred and can be added later. This
contract does not claim full Radix Themes runtime or framework compatibility.

## CSS Variables contract

`css-variables` remains the generic 50-name Larsen preset: background,
foreground, both 12-step solid scales, four harmony names, and 20 status
names. It makes no shadcn or Radix Themes compatibility promise.

## Alpha serialization

The shared formatter accepts 8-digit HEX and CSS colors with alpha. It
preserves alpha in every requested format instead of dropping the final HEX
byte in the RGB and HSL helper paths.

For source `#1E73C806`, the deterministic examples are:

| Format | Output |
| --- | --- |
| HEX | `#1E73C806` |
| RGB | `rgba(30, 115, 200, 0.0235)` |
| HSL | `hsla(210, 73.913%, 45.098%, 0.0235)` |
| HSL Values | `210 73.913% 45.098% / 0.0235` |
| OKLAB | `oklab(55.21% -0.0451 -0.1462 / 0.0235)` |
| OKLCH | `oklch(55.21% 0.153 252.9 / 0.0235)` |

Some final alpha-scale steps are intentionally opaque and therefore use the
normal opaque syntax. Tests require representative alpha scale and surface
values to retain an alpha-bearing syntax in every mode and format.

HSL and HSL Values retain up to four decimal places. Integer rounding changed
some source colors enough to move a 4.506 foreground pair to 4.486 after
serialization. Precision is therefore part of the contrast contract, not
only a cosmetic formatting choice.

## Default theme

The baked theme uses:

| Setting | Value |
| --- | --- |
| Seed | `#4DA0FF` |
| Preset | `shadcn` |
| Format | `hsl-values` |
| Neutral tint | `strong` |

The generator then pins background, foreground, and ring to the exact
`#FAFAFA` and `#0A0A0A` surface pair and appends the three brand-blue tokens.
Card, Popover, and Sidebar aliases are overridden with the same final values
where their approved mapping depends on those pinned tokens.
Regenerate the implemented default with `npm run gen:theme` and no argument.

## Automatic role correction

For seed lightness below 15 percent or above 85 percent, the package pairs the
seed with a lightness-inverted counterpart. The tested near-black case uses
`#0A0A0A` for light mode and `#F5F5F5` for dark mode. Every newly derived
shadcn and Radix value is rendered after this mode selection.

Mode selection alone is not sufficient for every mid-range hue. The shadcn
exporter therefore preserves the selected seed for primary only when it
reaches the 1.5 visibility floor against background, card, and popover and
supports a 4.6 foreground. Ring keeps it only when it reaches 3 against all
three surfaces. A failing role uses the perceptually closest passing color
from the same accent scale, then the gray scale, then a passing neutral.
Primary foreground is recomputed against the corrected primary with the
accent-scale-first, gray-scale-second chooser.

The black-white crossover has a narrow luminance interval where neither
neutral can reach 4.6. Analogous and complementary aliases in that interval
move to the closest text-safe color in their own scale, while the underlying
12-step harmony scales and chart mappings remain unchanged. Radix resolves an
affected accent or gray step 9 from one existing scale index and emits its
matching alpha step, indicator, track, and contrast value together. The raw
engine arrays remain unchanged.

`--input` is corrected the same way, but from the gray scale rather than the
accent scale, so a control boundary stays neutral. It is the closest gray
reaching 3:1 against every surface the control sits on: the page background
in light mode, and background, card, and popover in dark mode. In practice
this lands on gray-9 in light mode and gray-9 in dark mode instead of the
gray-7 the engine emits upstream. `--border` and `--sidebar-border` keep
gray-7.

`--foreground-subtle` begins at gray-10. If gray-10 is below 4.6 against the
mode background, a fixed 24-round binary search follows the OKLAB path toward
gray-11 and emits the passing 8-bit sRGB candidate at the isolated boundary.
The correction changes no gray-ramp token. The 4.6 target adds a 0.1 margin
above WCAG AA's 4.5 normal-text minimum.

## Test boundary

The mechanical contrast parser supports `shadcn`, `radix`, and
`css-variables` in `hex`, `rgb`, `hsl`, `hsl-values`, `oklab`, and `oklch`,
and checks both generated modes. The shadcn role checks are:

- foreground and foreground-subtle against background at the 4.6 project
  target, with a 0.1 margin above the WCAG 4.5 minimum.
- card-foreground against card at 4.6.
- popover-foreground against popover at 4.6.
- ring against background, card, and popover at 3.
- input against background, card, and popover at 3.
- primary-foreground against primary at 4.6.
- primary against background, card, and popover at the deliberately non-WCAG
  1.5 visibility floor.
- Secondary, muted, accent, destructive, harmony, and status foreground pairs
  at 4.6 where those roles exist.

`--border` is deliberately absent. WCAG 2.1 SC 1.4.11 covers visual
information required to identify a user interface component, and `--border`
paints card edges and separators, which are not components. `--input` paints
the boundary of text fields, selects, and outline buttons, where the border
is the only thing identifying the control, so it carries the 3:1 floor
instead.

It fails on missing required tokens or unparseable serialized colours. The
generator performs primary, ring, input, foreground-subtle, harmony-alias,
and Radix step-9 corrections before all six serialization formats. Radix
accent and gray contrast pairs are checked at 4.6 in all six formats. Both
neutral tints run through the representative shadcn contrast seeds and the
serialized-format checks. The deterministic matrix separately proves names,
order, mode structure, selected syntax, alpha preservation, exact declaration
baselines, approved mappings, and the distinction between Radix Themes and
CSS Variables.

The deterministic release sweep is `npm run verify:palette-sweep` from
`create-next-app`. It checks 762 unique seeds under both neutral tints, locks
the seed corpus SHA-256, and reports the weakest observed ratio for every
text, ring-surface, primary-surface, input, harmony, and semantic pair.
Upstream drift checks remain a separate networked verification concern. The
runtime suite is intentionally offline; the deterministic sweep locks its
seed corpus and order by SHA-256.
