# Palette generator audit - findings and plan

Date: 2026-08-09. Session A of `next-session-prompts.md`. Audit only - no
generated output has been changed. Every number below was produced by running
the real code in this session; the scripts live in the session scratchpad and
are described inline so they can be recreated.

## 1. Method

- **Matrix**: ran `generateThemeCss` (the public API, exactly as the CLI calls
  it) for all 3 presets x 6 formats, seed `#4DA0FF`, scheme `analogous`.
  Counted declarations in the light `:root` block, hashed the full CSS, hashed
  the token-name set, and regex-checked every value against the requested
  format.
- **Parity**: bundled rampkit's own TypeScript sources
  (`src/app/actions/generatePalette.ts` + `src/lib/export-formats.ts` from
  `/Users/stian/Developer/nettsider/rampkit`) with esbuild and compared their
  output against the vendored engine for three seeds (`#4DA0FF`, `#0A0A0A`,
  `#E11D48`): full scale data, semantic colors, and rendered shadcn/radix CSS.
- **Ground truth**: fetched `https://ui.shadcn.com/r/colors/neutral.json`
  (32 light-mode keys confirmed) and read rampkit's
  `src/hooks/useThemeUpdater.ts` for its live-preview derivations.
- **Repo state**: rampkit local `main` == `origin/main` == commit `48d6b33`,
  the exact vendored commit, with zero commits since. `git diff` shows
  `palette/` and `CSS/` untouched between the 0.2.1 commit (`d056122`) and
  HEAD.

## 2. Findings

### F1. The full 3x6 matrix

| Preset | Format | Light tokens | Names | Values match format? | Duplicate declaration set |
| --- | --- | ---: | --- | --- | --- |
| shadcn | HEX | 64 | S64 below | yes | none |
| shadcn | RGB | 64 | S64 below | yes | none |
| shadcn | HSL | 64 | S64 below | yes | none |
| shadcn | HSL Values | 64 | S64 below | yes | none |
| shadcn | OKLAB | 64 | S64 below | yes | none |
| shadcn | OKLCH | 64 | S64 below | yes | none |
| radix | HEX | 50 | C50 below | yes | css-variables x HEX |
| radix | RGB | 50 | C50 below | yes | css-variables x RGB |
| radix | HSL | 50 | C50 below | yes | css-variables x HSL |
| radix | HSL Values | 50 | C50 below | yes | css-variables x HSL Values |
| radix | OKLAB | 50 | C50 below | yes | css-variables x OKLAB |
| radix | OKLCH | 50 | C50 below | yes | css-variables x OKLCH |
| css-variables | HEX | 50 | C50 below | yes | radix x HEX |
| css-variables | RGB | 50 | C50 below | yes | radix x RGB |
| css-variables | HSL | 50 | C50 below | yes | radix x HSL |
| css-variables | HSL Values | 50 | C50 below | yes | radix x HSL Values |
| css-variables | OKLAB | 50 | C50 below | yes | radix x OKLAB |
| css-variables | OKLCH | 50 | C50 below | yes | radix x OKLCH |

- All 18 combinations run without error and emit values in the requested
  format, including OKLAB and OKLCH (our local fix works through the public
  API).
- **S64 - shadcn (64)** = 20 semantic tokens (`background`, `foreground`,
  `foreground-subtle`, `primary(-foreground)`, `secondary(-foreground)`,
  `muted(-foreground)`, `accent(-foreground)`, `destructive(-foreground)`,
  `border`, `input`, `ring`, `analogous(-foreground)`,
  `complementary(-foreground)`) + `accent-1..12` + `gray-1..12` + 20 status
  tokens (success/danger/warning/info x base/foreground/muted/
  muted-foreground/border).
- **C50 - radix / css-variables (50)** = `background`, `foreground`,
  `accent-1..12`, `gray-1..12`, `analogous(-foreground)`,
  `complementary(-foreground)` + the same 20 status tokens.
- Dark blocks mirror the same names in every combination. Every format changes
  its serialized declarations from the other five formats. The six
  radix/css-variables pairs are the only duplicate declaration sets.

### F2. radix == css-variables, precisely

For all six formats, the two presets produce **identical output once comments
are stripped**. The full files differ only because the generated header
comment and the "Document defaults" comment embed the preset name. Token
names, values, and order are the same. The cause is upstream:
`generateRadixCSS(data, format)` is literally
`return generateCSSVariables(data, format)`.

So the CLI's three-way preset choice is really a two-way choice wearing three
names.

### F3. shadcn coverage: 14 of 32, plus one legacy token

Against shadcn's current registry (32 light-mode keys in
`r/colors/neutral.json`):

- **We emit 14 of the 32**: background, foreground, primary,
  primary-foreground, secondary, secondary-foreground, muted,
  muted-foreground, accent, accent-foreground, destructive, border, input,
  ring.
- **Missing 18**: card, card-foreground, popover, popover-foreground, radius,
  chart-1..5, sidebar, sidebar-foreground, sidebar-primary,
  sidebar-primary-foreground, sidebar-accent, sidebar-accent-foreground,
  sidebar-border, sidebar-ring.
- **We also emit `--destructive-foreground`**, which current shadcn has
  dropped (confirmed absent from the registry's key list). Harmless extra for
  new projects; removing it would break projects generated by older CLI
  versions.
- Our additions (`accent-1..12`, `gray-1..12`, status colors, `analogous`,
  `complementary`, `foreground-subtle`) do not collide with any shadcn name.

### F4. Format correctness details

- Every value matches its requested format, with one cosmetic inconsistency:
  colorjs.io shortens hex where it can, so `--gray-1: #eee` appears among
  six-digit values in `hex` output. Valid CSS, just inconsistent.
- Upstream rampkit's `formatColor` has no OKLAB/OKLCH cases - selecting OKLCH
  on rampkit.app exports raw hex (verified: upstream bundle emits
  `--primary: #4DA0FF` inside an "OKLCH" export). Our vendored engine fixes
  this (NOTICE.md deviation 3).

### F5. Parity with rampkit

**The engine itself has zero drift.** For all three test seeds, the vendored
engine and rampkit's sources produce byte-identical scale data, semantic
colors, and rendered shadcn/radix CSS - the only exception is OKLAB/OKLCH,
where upstream falls back to hex and we emit real values.

A user who runs the same seed through rampkit.app's **export** and through our
CLI gets the same colours, with exactly three differences, all ours and all
documented:

1. **OKLAB/OKLCH**: we emit real values; rampkit.app exports hex.
2. **Dual-seed rule**: for seeds with lightness <15% or >85%, our dark (or
   light) block is generated from a lightness-inverted counterpart seed.
   rampkit.app renders both modes from the raw seed (this is the 1.03:1
   invisible-button bug our rule fixes).
3. **Default theme only**: `generate-default.mjs` pins
   `--background`/`--foreground`/`--ring` and appends the brand-blue accents.
   Custom `--hex` runs have no overrides.

Plus structure: we re-wrap into `:root` + media query + `[data-theme]` blocks
and append document defaults; rampkit exports the engine's raw two blocks.

The live app was also opened with the controlled URL `?hex=4DA0FF`, which
visibly left color harmony off. Its accent ramps matched the vendored engine
exactly:

- Light: `#edeff1`, `#e5ebf2`, `#d7e3f3`, `#c3dcf9`, `#add1fd`, `#94c3fc`,
  `#76b1f8`, `#4497f5`, `#4da0ff`, `#4194f2`, `#005bb4`, `#003071`.
- Dark: `#08111b`, `#0f1925`, `#0e2845`, `#033260`, `#0c3e73`, `#1a4d84`,
  `#275d9b`, `#2f70ba`, `#4da0ff`, `#4194f2`, `#77b7ff`, `#cae3ff`.

The dual-seed difference is concrete rather than just structural. For
`#0A0A0A` with the monochromatic scheme, the CLI light block is identical to
Rampkit and the dark block comes from `#F5F5F5`:

- shadcn changes 35 dark values: `foreground`, `foreground-subtle`, the
  primary, secondary, muted, and accent pairs, `border`, `input`, `ring`, both
  harmony pairs, accent steps 3, 4, 8, 9, 10, and 11, and all 12 gray steps.
- radix and css-variables change 23 dark values: `foreground`, accent steps 3,
  4, 8, 9, 10, and 11, all 12 gray steps, and both harmony pairs.

For `#F5F5F5`, the CLI dark block is identical and the light block comes from
`#0A0A0A`:

- shadcn changes 35 light values.
- radix and css-variables change 25 light values: `foreground`, accent steps
  2, 5, 6, 7, 8, 9, 10, 11, and 12, gray steps 2 through 12, and both harmony
  pairs.

These are the exact color differences a Rampkit user sees with extreme seeds,
and they are the intended contrast fix.

**But rampkit.app's live preview is a third thing.** `useThemeUpdater.ts`
derives its on-screen tokens with `getBestForegroundStep` (picks scale step 0
or 11/10 by endpoint contrast), while the export path uses
`getBestForeground` (full WCAG search across accent, then gray, then
black/white). The preview also derives tokens the export never emits: `--card`
(gray step 2), `--card-foreground` (from the *accent* scale), `--popover`,
`--foreground-subtle` (gray-11 in preview vs gray-10 in export). So what you
*see* on rampkit.app is not what you *export* from rampkit.app. Our CLI
matches the export path.

### F6. Three-way check (one sentence)

The site and CLI use byte-identical published palette code, while rampkit.app
shares their mid-seed palette data but differs through its HEX fallback for
OKLAB/OKLCH and the CLI's wrapper, default-theme overrides, and extreme-seed
correction.

### F7. What the engine computes and throws away

Every `generatePalette` call already produces, per mode:

- `accentScaleAlpha` and `grayScaleAlpha` (12-step alpha scales)
- `radixOriginalLight/Dark`: most of the Radix Themes custom-palette output -
  `accentContrast`, `accentSurface`, `graySurface`, and background, plus
  wide-gamut P3
  variants of every scale (`accentScaleWideGamut`, `accentScaleAlphaWideGamut`,
  `grayScaleWideGamut`, `grayScaleAlphaWideGamut`, `accentSurfaceWideGamut`,
  `graySurfaceWideGamut`)
- complete **analogous** and **complementary** sub-palettes, each with its own
  accent/gray scales and alpha scales

Most of those additional fields are not emitted by any preset. Closing the
Radix gap and adding chart colours requires **no new palette-generation
math** - only exporter, formatter, and test plumbing.

The complete relevant Radix Themes 3.3.0 contract is slightly larger than the
established gap list. It also defines `--color-background`,
`--gray-contrast`, `--gray-indicator`, and `--gray-track`. Background is stored
already; accent and gray indicator/track are step-9 references in Radix
Themes' own tokens. Gray contrast is not stored as a named engine field, but
the existing foreground chooser can derive it against gray step 9. No new
palette-generation algorithm is required.

## 3. What each preset should be (question 5)

**Recommendation: option (a) - make `radix` emit the real Radix Themes
contract, and keep `css-variables` as the honest generic-scales preset.**

- `shadcn` = "the token contract shadcn components consume", completed per
  section 4.
- `radix` = "the token contract Radix Themes styling consumes": 57 exact
  Radix names consisting of `--color-background`, both 12-step solid scales,
  both 12-step alpha scales, and contrast/surface/indicator/track for both
  accent and gray. Keep the current 26 generic base, harmony, and status names
  as additive extras, for 83 unique names in total. Suggested first cut skips
  the wide-gamut P3 `@supports` blocks to keep the file readable - they can be
  added later without breaking anything.
- `css-variables` = what it is today: plain scales + status colors, no
  framework promise. Nothing to change.

Why not (b) rename or (c) drop: the engine already has the scales, surfaces,
contrast value, and shared foreground helper needed for the contract. The work
is bounded exporter, formatter, and contract-test plumbing. Renaming keeps two
identical presets under different labels; dropping loses a preset users of
Radix actually want. The misleading-name problem is solved by making the name
true.

One naming decision to settle: the CLI labels the preset "Radix Colors", but
the contract worth targeting is **Radix Themes** (the component library's
tokens). Suggest relabeling the prompt text to "Radix Themes tokens" in the
same change so the promise is exact.

The 57 exact Radix names are:

- `--color-background`.
- `--accent-1..12`, `--accent-a1..a12`, `--accent-contrast`,
  `--accent-surface`, `--accent-indicator`, and `--accent-track`.
- `--gray-1..12`, `--gray-a1..a12`, `--gray-contrast`, `--gray-surface`,
  `--gray-indicator`, and `--gray-track`.

Their exact engine sources are:

| Radix token | Source |
| --- | --- |
| `--color-background` | `radixOriginal<Mode>.background` |
| `--accent-1..12` | `radixOriginal<Mode>.accentScale` |
| `--accent-a1..a12` | `radixOriginal<Mode>.accentScaleAlpha` |
| `--accent-contrast` | `radixOriginal<Mode>.accentContrast` |
| `--accent-surface` | `radixOriginal<Mode>.accentSurface` |
| `--accent-indicator`, `--accent-track` | `radixOriginal<Mode>.accentScale[8]` |
| `--gray-1..12` | `radixOriginal<Mode>.grayScale` |
| `--gray-a1..a12` | `radixOriginal<Mode>.grayScaleAlpha` |
| `--gray-surface` | `radixOriginal<Mode>.graySurface` |
| `--gray-indicator`, `--gray-track` | `radixOriginal<Mode>.grayScale[8]` |
| `--gray-contrast` | Existing foreground chooser against `grayScale[8]` |

Alpha-token formats need a real formatter fix. Alpha scale values are stored
as 8-digit HEX, while the current RGB and HSL helpers read only the first six
digits and silently discard alpha. Emitting native HEX inside an RGB, HSL,
OKLAB, or OKLCH selection would also make the requested format claim false.
The shared formatter should preserve alpha in all six syntaxes, including
`H S% L% / A` for HSL Values. Contract tests should reject either alpha loss
or a notation exemption.

## 4. Closing the shadcn gap (question 4)

Derivations, all from data already computed. Where rampkit's preview
(`useThemeUpdater.ts`) has a mapping, it is noted; deviations from it are
deliberate and explained.

| Token | Light | Dark | Note |
| --- | --- | --- | --- |
| `--card` | `lightBackground` | `grayScale.dark[1]` | shadcn neutral: card == background in light, one step raised in dark. rampkit preview uses gray[1] in both; light gray[1] on a gray[0]-ish page reads dirty. |
| `--card-foreground` | `--foreground` value | `--foreground` value | shadcn semantics: card text == body text. rampkit preview tints it from the accent scale - do not copy that. |
| `--popover` | `lightBackground` | `grayScale.dark[2]` | Matches rampkit preview (light popover = background, dark popover = gray[2]). |
| `--popover-foreground` | `--foreground` value | `--foreground` value | Same reasoning as card-foreground. |
| `--radius` | `var(--radius-md)` | inherited | Static, not colour. The alias keeps the value DRY and preserves core.css's existing 8px decision. shadcn's sample is 0.625rem - decision point below. |
| `--chart-1` | `accentScale.light[8]` | `accentScale.dark[8]` | The brand accent (step 9). |
| `--chart-2` | `analogous.accentScale.light[8]` | dark[8] | Already computed per call. |
| `--chart-3` | `complementary.accentScale.light[8]` | dark[8] | Already computed per call. |
| `--chart-4` | `semantic.light.warning.base` | dark | Distinct hue family. |
| `--chart-5` | `semantic.light.success.base` | dark | Distinct hue family. |
| `--sidebar` | `--card` value | `--card` value | shadcn neutral: sidebar sits on the card surface family. |
| `--sidebar-foreground` | `--foreground` | same | Straight alias, as in shadcn's own defaults. |
| `--sidebar-primary` | `--primary` | same | Alias. |
| `--sidebar-primary-foreground` | `--primary-foreground` | same | Alias. |
| `--sidebar-accent` | `--accent` (accentScale[2]) | same | Alias. |
| `--sidebar-accent-foreground` | `--accent-foreground` | same | Alias. |
| `--sidebar-border` | `--border` | same | Alias. |
| `--sidebar-ring` | `--ring` | same | Alias. |

Notes:

- A monochromatic or near-neutral seed collapses chart hues toward one
  family. That is acceptable: shadcn's own neutral theme ships *achromatic*
  chart colours (`chart-1: oklch(0.87 0 0)`).
- The aliases are emitted as resolved values, not `var()` references, so the
  file stays format-consistent and each block remains self-contained. Radius
  is the deliberate exception because it is structural rather than a color.
- The dual-seed rule already runs before rendering, so all derivations
  inherit it for free.
- New card/popover surface pairs should be added to the smoke test's contrast
  check (text >= 4.5:1 on card and popover in both modes).
- `--destructive-foreground`: **keep emitting it** (recommendation). Extra
  tokens cost nothing, current shadcn simply ignores it, and dropping it
  breaks apps generated by 0.1.0-0.2.2. Revisit only if shadcn's registry
  starts erroring on unknown tokens (it does not today).
- Adding all 18 missing official names takes the shadcn preset from 64 to 82
  unique names while retaining every additive Larsen token.
- Honest scope note: `npx shadcn add` also assumes Tailwind in the target
  project, so "component just works" is really "the token contract holds".
  The Tailwind half is Session B's question - which is exactly why A runs
  before B.

## 5. A 50-950 scale preset (question 6)

**Recommendation: no.** Reasons:

- 50-950 is Tailwind's idiom; its natural consumer is a Tailwind project.
  The Session B review (recorded in PROJECT.md section 8, 2026-08-09)
  decided against Tailwind support entirely, so the preset would have no
  consumer this package scaffolds.
- The mapping is lossy: Radix's 12 steps are *role-based* (1-2 backgrounds,
  3-5 interactive, 6-8 borders, 9-10 solids, 11-12 text), while Tailwind's 11
  slots are roughly lightness-uniform. A positional map (1->50, 2->100, ...,
  12->950) misrepresents both conventions; a lightness-resample invents
  colours the engine never produced.
- If the Tailwind decision is ever reopened, the right shape is probably not
  a fourth preset but `@theme` output generated from the existing scales - a
  format concern, not a preset concern.

## 6. Smoke-test preset contracts (question 7)

**Yes - this class of gap survived because nothing asserted the contract.**
Plan:

- Add a `PRESET_CONTRACTS` fixture to `smoke.mjs`: for `shadcn`, the pinned
  list of the 32 registry keys (+ our extras marked as such); for `radix`, the
  57-name Radix Themes token list; for `css-variables`, the current 50.
- Assert all 18 preset x format combinations: emitted color-token sets are a
  superset of the contract, with no duplicates, in **both** light and dark
  blocks. Assert root-level inherited `--radius` separately.
- Assert values match the requested format (the regex sniffers from this
  audit) and use alpha-bearing fixtures to prove that no formatter drops
  alpha. Radius is checked separately as the one non-color shadcn token.
- Assert `radix` output != `css-variables` output once the fix lands (guards
  the regression that started all this).
- The fixture is pinned, not fetched, so the smoke test stays offline and
  deterministic. Drift against the live registry is a manual/scheduled check
  (the weekly-smoke idea already in CHANGELOG's Unreleased ideas).

## 7. Implementation plan (no output changes until approved)

Where the fix lives - decision point, with a recommendation:

- **Recommended: implement in the vendored engine now** (new functions in
  `palette/engine/export-formats.js` + wiring in `palette/index.js`), record
  as deviations 5 and 6 in `NOTICE.md`, and port upstream to rampkit
  afterwards (already an Unreleased idea). Ships value without coupling to a
  rampkit release, and the landing page inherits it automatically at the next
  package version.
- Alternative: implement in rampkit first, re-vendor at a new commit. Cleaner
  provenance, but blocks this package on a rampkit release cycle, and the
  rampkit.app export UI would also need to grow the new tokens to benefit.

Phases (each independently shippable, in order):

1. **Contract tests and alpha serialization**: pin the 32 shadcn, 57 Radix,
   and 50 generic names; add the complete 18-cell matrix; make the shared
   formatter preserve alpha in all six syntaxes before any alpha scale is
   exposed.
2. **shadcn completion** (user-facing breakage fix): extend
   `generateShadcnCSS` with section 4's derivations; extend contrast checks;
   update the generated `DESIGN.md` token reference for the shadcn preset;
   smoke contract assertion for shadcn. Minor version bump (a generated
   project gains tokens - additive).
3. **radix realization**: new `generateRadixCSS` emitting the full 57-name
   Radix Themes contract plus the current 26 extras; relabel prompt text;
   update `DESIGN.md`
   variant + `tokenRoles` if role mappings change (they do not have to -
   gray-2/gray-6 fallbacks still exist); smoke contract assertion + the
   "radix != css-variables" assertion. Minor bump.
4. **Docs sweep**: PROJECT.md sections 3/5/11, CHANGELOG entries with the
   version that ships each phase, landing-page preset hints
   (`src/lib/palette.ts` PRESETS descriptions) after the package version
   bumps.
5. **Verification**: run the matrix, `npm run smoke`, and
   `npm run smoke:full`; scaffold a disposable project and add representative
   shadcn Card, Popover, Chart, and Sidebar components to prove every
   referenced variable resolves.
6. **Later / separate**: port deviations upstream to rampkit; optional P3
   wide-gamut blocks for the radix preset.

Explicitly not in scope: renaming existing tokens, removing
`--destructive-foreground`, any Tailwind work.

## 8. Decisions needed before implementation

1. Preset fate: fix `radix` to real Radix Themes tokens (recommended), vs
   rename, vs drop.
2. Relabel the prompt "Radix Colors" -> "Radix Themes tokens"? (recommended
   yes, same change)
3. `--radius` value: `var(--radius-md)` at 0.5rem (DRY and aligned with
   core.css; recommended) or `0.625rem` (shadcn's sample)?
4. `--destructive-foreground`: keep (recommended) or drop?
5. Chart mapping: accent/analogous/complementary/warning/success as proposed,
   or a different five?
6. Fix location: vendored engine now + upstream later (recommended), or
   upstream-first re-vendor?
7. P3 wide-gamut blocks in the radix preset: defer (recommended) or include?
8. Include the complete 57-name Radix contract and retain the 26 Larsen
   extras, producing 83 names (recommended), or target only the shorter gap
   list from the original brief?
