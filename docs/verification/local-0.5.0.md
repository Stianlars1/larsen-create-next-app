# Local 0.5.0 verification

Local implementation evidence collected on 2026-08-10 for the combined
neutral-tint, multi-source agent-skill, and contrast-correction change. It
proves the behavior named below on an uncommitted working tree. It is **not** a
packed release artifact, npm publication, tag, GitHub Release, or registry
evidence.

The publishable tarball must be packed by `npm run pack:release` from a clean
committed `main`, and that exact file must pass `npm run smoke:full` before
Stian publishes it. Neither had run at the time of this record, because
`pack-release` refuses a dirty source tree by design.

## Scope

| Field | Value |
| --- | --- |
| Package version in source | `0.5.0` |
| Base commit | `9805ac2` |
| Working tree | uncommitted |
| Vendored engine | changed; `palette/NOTICE.md` deviations 10 and 11 added |

## Neutral tint replaces scheme

Both public values were compared against the committed `HEAD` generator, which
still exposed `scheme`. Declaration sets were hashed after stripping the file
header.

- 9 seeds x 3 presets x 6 formats x 5 comparisons = **810 comparisons, 0
  differences** at the point the mapping was introduced.
- `subtle` selects the neutral ramp formerly produced by `analogous`,
  `complementary`, and `triadic`, which were byte-identical to each other.
- `strong` selects the ramp formerly produced by `monochromatic`.
- Omitting `--neutral-tint` reproduces `subtle` exactly.

Two later 0.5.0 fixes deliberately change generated output on top of that
mapping, and are recorded separately below: the `--input` contrast floor and
the hue-360 fallback. Radix Themes and CSS Variables declarations are
unchanged from 0.4.0, because neither preset emits `--input`.

Seeds used: `#4DA0FF`, `#E11D48`, `#22C55E`, `#7C3AED`, `#A1A1A1`, `#EFB100`,
`#0A0A0A`, `#FFFFFF`, `#005F5A`.

## What neutral tint actually moves

Measured over a 233-seed sweep of hue, saturation, and lightness in
`shadcn` x `hsl-values`, both mode blocks:

- All twelve gray steps can move.
- Twenty semantic tokens built on the gray ramp can move, including
  `--foreground`, `--muted`, `--card`, `--popover`, `--border`, `--input`,
  and the sidebar surfaces.
- `--background`, `--primary`, `--ring`, and `--accent-1` through
  `--accent-12` did not move for any chromatic seed.
- Largest single-channel difference observed anywhere: **4 of 255**.

The documented exception is a seed with no hue of its own. `#000000`,
`#010101`, `#FEFEFE`, and `#FFFFFF` take their accent scale from the same
tinted neutral, so 15 accent values move as well. A 256-step gray ladder and
a 462-seed hue/saturation/lightness sweep found no other seed with this
behavior. `create-next-app/test/neutral-tint.test.mjs` locks both halves.

## Contrast correction for --input

`--input` was gray-7, measuring 1.7:1 to 2.1:1 against the page background. It
paints the boundary of text fields, selects, and outline buttons, where
nothing else identifies the control, so WCAG 2.1 SC 1.4.11 requires 3:1. It is
now the closest gray clearing 3:1 against every surface such a control sits
on: the page background in light mode, and background, card, and popover in
dark mode. `--border` and `--sidebar-border` keep gray-7 - card edges and
separators are not user interface components, and the same floor would give
every card a heavy outline.

The shipped gate gained `--input` against `--background`, `--card`, and
`--popover` at 3. This is the only generated-output change beyond the
neutral-ramp mapping and the hue fix, and it affects `shadcn` only.

## Hue-360 fallback

Found by the full sweep below. `hexToHSL` rounded the hue of a seed at the top
of the red wedge to 360, and `generateHarmoniousPalette` rejects a hue outside
`[0, 360)`. It warned on stderr and built the entire palette from the engine's
default blue instead of the requested color. `#940203` reproduced it.

Both converters now wrap the hue modulo 360. `#940203` produces an accent at
hue 359.589 instead of 212. In one sampled slice of the color cube, 576
colors were affected. `isValidHex` also answers false for a non-string instead
of throwing, so a direct API call reports the package's own
`Invalid HEX color` message.

## Full contrast sweep

`shadcn` x `hsl-values`, both neutral tints, over 18 named site seeds, 600
deterministic pseudo-random seeds, and 144 edge seeds - **1524 generated
themes, 0 failures**. Worst observed ratio per checked pair:

| Pair | Required | Worst observed | Seed |
| --- | ---: | ---: | --- |
| foreground vs background | 4.5 | 14.24 | `#9CBB31` |
| card-foreground vs card | 4.5 | 14.24 | `#9CBB31` |
| popover-foreground vs popover | 4.5 | 13.57 | `#A3004C` |
| ring vs background | 3 | 3.00 | `#1D0E74` |
| input vs background | 3 | 3.65 | `#DD5642` |
| input vs card | 3 | 3.38 | `#BF9975` |
| input vs popover | 3 | 3.04 | `#DD5642` |
| primary-foreground vs primary | 4.5 | 4.50 | `#DD02CA` |
| primary vs background | 1.5 (visibility floor) | 1.50 | `#F4EE70` |

Three pairs land exactly on their floor, which is the correction algorithm
choosing the closest passing candidate rather than overshooting.

Pairs outside the shipped gate were also measured across the same seeds.
`--muted-foreground`, `--accent-foreground`, `--secondary-foreground`,
`--destructive-foreground`, and every sidebar foreground pair clear 4.5 in
both modes. `--foreground-subtle` against `--background` measures 4.41 to 4.45
in light mode. It is a de-emphasised label color rather than body text, is
unchanged from 0.4.0, and is not covered by the gate; raising it is a separate
decision.

Edge-case handling verified in the same run:

- Accepted and normalized: `#4DA0FF`, `4DA0FF`, `4da0ff`, `abc`, `#ABC`,
  `#000`, `fff`, and a value padded with spaces.
- Rejected with the package message: empty, whitespace, `#`, `#12`, `#12345`,
  `#1234567`, `GGGGGG`, `#GGG`, `rgb(0,0,0)`, `null`, `undefined`, `123`.
- 144 preset x format x tint x seed combinations produced all four theme
  blocks and recorded the selected tint in the header, with no structural
  failures.

## Real CLI runs

`node bin/cli.js` scaffolded real projects with `--no-git --no-install`:

| App | Flags | Result |
| --- | --- | --- |
| `app-a` | `--hex 22C55E` | header records `neutral tint: subtle` |
| `app-b` | `--hex 22C55E --neutral-tint subtle` | byte-identical to `app-a` |
| `app-c` | `--hex 22C55E --neutral-tint strong` | only gray and gray-derived declarations differ |

`DESIGN.md` recorded the selected tint in all three. No accent, `--primary`,
`--background`, or `--ring` declaration appeared in the `app-a` vs `app-c`
diff.

Rejections were exercised against the real binary: `--scheme` is unknown and
now reports the parser message plus its replacement instead of a stack trace;
`--neutral-tint` without `--hex`, with an unknown value, and with an empty
value are each rejected with a specific message and exit 1; an unknown skill
name lists the ten selectable names.

The interactive palette branch now asks four questions - HEX, preset, format,
neutral tint - with the default preselected on the last one. This was not
verified by driving a real terminal: an attempt to drive Clack through a
pseudo-terminal stalled on its raw-mode key handling and was abandoned.
Instead the branch is built from an exported `PALETTE_PROMPT_CONTRACT`, and
`documentation.test.mjs` asserts that the contract equals the seed plus every
option that requires it, in order, and that the CLI reference describes the
same sequence. The landing page checks its walkthrough against the same
exported contract.

## Suites

| Gate | Result |
| --- | --- |
| `node scripts/generate-cli-reference.mjs --check` | current |
| `npm test` (package) | 155 / 155 |
| `node scripts/smoke.mjs --dev` | all checks passed, including a real `motion-craft,transitions-dev` install from two source repositories |
| `npm run smoke` (tarball mode) | not run - `pack-release` refuses a dirty tree |
| `npm run smoke:full` | not run - requires the packed tarball |

## Landing page

Verified against a production build served locally, not deployed:

- First paint is `Subtle (default)`, the neutral-tint disclosure is collapsed,
  and the command carries no `--neutral-tint`.
- Selecting `Strong` adds `--neutral-tint strong`, outlines the exact gray
  steps that moved, and reports the accent scale as unchanged.
- For `#000000` the same control reports 9 of 12 light and 6 of 12 dark accent
  steps moved, which is the documented hueless-seed exception rather than a
  hidden one.
- Returning to `Subtle` removes both the flag and the comparison.
- Invalid HEX shows its error, drops the Rampkit link, and does not re-theme.
- `src/lib/package-contract.test.mjs` checks the site's flags, choices,
  defaults, palette question order, skill catalogue, prompt wording, and skill
  counts against the installed package rather than against its own copy, and
  runs all 18 named seeds through the package's contrast gate under both
  tints.
- Site gates: 16 / 16 tests, lint clean, `tsc --noEmit` clean, production
  build succeeds.

The site still declares `@larsen-utvikling/create-next-app@^0.4.0`. It must be
bumped to the published `0.5.0` and reinstalled before deployment; until then
the drift guard fails on purpose. The local verification above ran against an
unsaved install of a locally packed `0.5.0`.
