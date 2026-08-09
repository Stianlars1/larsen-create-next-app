# Palette contract and known gaps

Current package-only reference for `palette/index.js` and the generated
`theme.css` output. Counts and equivalence were checked on 2026-08-09 by
running the public generator for all 18 preset-format combinations. The test
fixture in `create-next-app/test/palette-contract.test.mjs` now locks this
implemented contract.

This document does not describe any product site or the live Rampkit preview.
`palette/NOTICE.md` is authoritative for vendored source provenance and local
engine deviations.

## Current matrix

The matrix uses seed `#4DA0FF` and scheme `analogous`. Each light, automatic
dark, explicit light, and explicit dark block has the same declaration names.

| Preset | Format | Declarations per block | Format syntax checked | Equivalent declaration set |
| --- | --- | ---: | --- | --- |
| shadcn | hex | 64 | yes | none |
| shadcn | rgb | 64 | yes | none |
| shadcn | hsl | 64 | yes | none |
| shadcn | hsl-values | 64 | yes | none |
| shadcn | oklab | 64 | yes | none |
| shadcn | oklch | 64 | yes | none |
| radix | hex | 50 | yes | css-variables x hex |
| radix | rgb | 50 | yes | css-variables x rgb |
| radix | hsl | 50 | yes | css-variables x hsl |
| radix | hsl-values | 50 | yes | css-variables x hsl-values |
| radix | oklab | 50 | yes | css-variables x oklab |
| radix | oklch | 50 | yes | css-variables x oklch |
| css-variables | hex | 50 | yes | radix x hex |
| css-variables | rgb | 50 | yes | radix x rgb |
| css-variables | hsl | 50 | yes | radix x hsl |
| css-variables | hsl-values | 50 | yes | radix x hsl-values |
| css-variables | oklab | 50 | yes | radix x oklab |
| css-variables | oklch | 50 | yes | radix x oklch |

The radix and css-variables declaration names, values, and ordering are equal
within each format. Full generated files differ only where comments name the
preset. The current engine implementation delegates the radix exporter to the
CSS-variables exporter.

### shadcn names

The 64 names are:

- 20 current semantic names: background, foreground, foreground-subtle,
  primary and foreground, secondary and foreground, muted and foreground,
  accent and foreground, destructive and foreground, border, input, ring,
  analogous and foreground, complementary and foreground.
- `accent-1` through `accent-12`.
- `gray-1` through `gray-12`.
- 20 status names: success, danger, warning, and info, each with foreground,
  muted, muted-foreground, and border variants.

### radix and css-variables names

The 50 names are background, foreground, both 12-step scales, both harmony
pairs, and the same 20 status names.

## Default theme

The baked theme uses:

| Setting | Value |
| --- | --- |
| Seed | `#4DA0FF` |
| Preset | `shadcn` |
| Format | `hsl-values` |
| Scheme | `monochromatic` |

The generator then pins background, foreground, and ring to the exact
`#FAFAFA` and `#0A0A0A` surface pair and appends the three brand-blue tokens.
Regenerate the implemented default with `npm run gen:theme` and no argument.

## Extreme-seed correction

The engine normally keeps primary and ring at the input seed in both modes.
For seed lightness below 15 percent or above 85 percent, this package instead
uses the seed in the mode where it has useful contrast and a
lightness-inverted counterpart in the other mode. The tested near-black case
uses `#0A0A0A` for light mode and `#F5F5F5` for dark mode.

This wrapper behavior intentionally differs from rendering both modes from
the same extreme seed. It is part of the package contract and is covered by
required-token and contrast tests.

## Known upstream coverage gaps

These are known limits, not implemented work.

### shadcn

The 2026-08-09 audit compared the output with the 32 light-mode names in the
then-current shadcn neutral registry. The package emitted 14 of those names.
It did not emit card, popover, radius, chart, or sidebar contracts. It also
retained `--destructive-foreground`, which was absent from that registry but
remains compatible with older generated projects.

Adding the missing names requires an approved compatibility decision,
deterministic fixtures, generated-project coverage, and a migration decision
for the legacy extra. No such expansion is implemented in 0.3.0.

### Radix Themes

The current radix output is a 50-name generic scale contract, not the complete
Radix Themes custom-palette contract. It omits alpha scales,
`--color-background`, contrast, surface, indicator, and track roles. The
engine already computes much of the underlying data, but the exporter and
formatters do not expose it.

The audit proposed an 83-name result: 57 relevant Radix Themes names plus the
26 existing package extras. That number is a design proposal only. It is not
implemented and is not asserted by current tests.

### Alpha formatting

Exposing stored alpha scales requires alpha-aware serialization for every
format. The current RGB and HSL helper path discards alpha from eight-digit
HEX input. Token expansion must not proceed until alpha preservation has its
own failing tests and implemented formatter contract.

## Tailwind review

Tailwind remains out of scope. The CLI always passes `--no-tailwind`. Adding
Tailwind would create a second styling API, require a token-to-utility bridge,
and introduce reset ownership and cascade questions beside this package's
vanilla CSS reset. The vendored engine's Tailwind exporter is not a supported
bridge for this package.

Do not add a Tailwind flag, guide, or companion output to this package. Reopen
the product decision only on explicit user demand, and treat a separately
named package as a new product rather than silently widening this contract.

## Test boundary

The mechanical contrast parser supports only `shadcn` with `hsl-values` and
checks both generated modes:

- `--foreground` vs `--background` must reach 4.5.
- `--ring` vs `--background` must reach 3.
- `--primary-foreground` vs `--primary` must reach 4.5.
- `--primary` vs `--background` must reach a deliberately non-WCAG 1.5
  visibility floor.

It fails on missing required tokens. It does not guarantee contrast for any
other preset-format matrix entry.

The deterministic matrix proves the names, order, four-block structure, and
selected serialization syntax of the current output. It deliberately records
the current incomplete preset contracts. It does not prove future parity with
shadcn or Radix Themes. Upstream drift checks belong in a separately approved,
networked verification job.
