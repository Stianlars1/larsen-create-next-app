# Changelog

All notable changes to `@larsen-utvikling/create-next-app`.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This
project uses [semantic versioning](https://semver.org/), where a change to what
a generated project contains counts as user-facing.

---

## [Unreleased]

## [0.6.0] - 2026-08-21

### Changed
- Curated success, danger, warning, and info scales now stay inside recognizable semantic families selected from the input HEX.
- Generated text pairs use a 4.6 project contrast target, while primary and focus ring are checked against page, card, and popover surfaces.
- Palette override values now reject malformed HEX before generation.
- `--foreground-subtle` now targets 4.6:1 against its mode background. This is
  a 0.1 safety margin above WCAG AA's 4.5:1 normal-text minimum and is applied
  before all six output formats are serialized.
- Contrast verification now parses shadcn, Radix, and CSS Variables output in
  HEX, RGB, HSL, HSL Values, OKLAB, and OKLCH. It covers the documented text
  foreground roles, shadcn control indicators, and Radix accent and gray
  contrast roles in both modes.
- Optional skills remain fresh from their upstream repositories. Generated
  README and `AGENTS.md` now record the observed upstream HEAD when available
  and a SHA-256 digest of the verified `SKILL.md` contents for each successful
  source.
- Full release smoke now covers npm, pnpm, yarn, and bun sequentially. It
  verifies real installs for available managers and the promised preserved
  scaffold plus warning for missing managers.
- Release candidates now live in dedicated temporary directories instead of
  the package checkout. `release:cleanup` removes only a validated candidate
  root after owner publication and registry verification.
- The generated starter no longer reduces text contrast with opacity. Its
  footer link has a visible focus indicator and 44px target height, and
  duplicate visual swatches are hidden from assistive technology.

### Fixed
- The palette reference now reports the exact hueless-seed accent changes by
  mode: 15 total for `#000000`, 6 for `#010101`, 9 for `#FEFEFE`, and 15 for
  `#FFFFFF`.

## [0.5.1] - 2026-08-10

Local implementation evidence is recorded in
`docs/verification/local-0.5.1.md`. This section describes local source
behavior and is not npm publication, tag, release, or deployment evidence.

### Changed
- `--foreground-subtle` still starts at gray-10. When that color is below 4.5
  against its mode background, a fixed 24-round binary search follows the
  OKLAB path toward gray-11 and emits the passing 8-bit sRGB candidate at the
  isolated boundary. The gray ramp itself is unchanged. The mechanical
  shadcn checker now includes this 4.5 pair.
- `darkHex` now rejects supplied blank, malformed, and non-string values with
  an explicit package error. `null` and `undefined` remain absent values, and
  valid three- and six-digit HEX values continue to work.
- Generated README and `AGENTS.md` now use the same source-aware skills
  section. Projects with no skills or only Larsen Skills do not link to an
  unselected third-party source.
- Release packing now excludes only dated local verification records from its
  clean-source gate. An uncommitted change to the final published-release
  ledger blocks the candidate.
- Neutral-tint accent invariance is explicitly limited to chromatic seeds. The
  hueless exceptions are `#000000`, `#010101`, `#FEFEFE`, and `#FFFFFF`.

### Verified locally
- The deterministic `npm run verify:palette-sweep` gate covers 762 unique
  seeds under both neutral tints, has SHA-256
  `25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9`, and
  reports 1,524 generated themes with zero failures.
- Full six-format tests, declaration parity outside the foreground-subtle
  correction, the CLI reference check, and the current documentation contract
  are recorded as local pre-publication evidence only.

## [0.5.0] - 2026-08-10

### Added
- `transitions-dev` can be selected explicitly or through the interactive
  picker. It installs directly from Jakub Antalik's repository under the
  Transitions.dev terms and is never vendored into Larsen Skills.
- `--neutral-tint <subtle|strong>` controls how much of the seed hue reaches
  the gray ramp. Custom palettes default to `subtle`; the baked Larsen theme
  remains `#4DA0FF` with `strong` neutral tint.

- Neutral tint is now the fourth interactive palette question, asked last with
  `subtle` preselected, so the choice is discoverable without a flag.

### Changed
- `--input` is now the closest gray that reaches 3:1 against every surface a
  control sits on, instead of gray-7 at roughly 1.7:1. It paints the boundary
  of text fields, selects and outline buttons, where nothing else identifies
  the control, so WCAG 2.1 SC 1.4.11 applies. `--border` and
  `--sidebar-border` keep gray-7: card edges and separators are not user
  interface components. This role correction affects `shadcn` only. The
  separate hue-360 correction changes complete palettes in every preset and
  format for affected seeds.
- Agent skill requests are grouped by source repository, with one installer
  invocation and independent on-disk verification per source.
- A generated project credits only the skill sources it actually installed. A
  project that declines skills, or that installs Larsen Skills alone, no
  longer carries a pointer to a third-party collection it never asked for.
- `--skills recommended` remains the four recommended Larsen skills,
  `--skills all` remains all nine Larsen skills, and `--defaults` still
  installs none.
- The public palette API now uses `neutralTint` and exports `NEUTRAL_TINTS`.
  `subtle` selects the former analogous, complementary, and triadic neutral
  ramp, while `strong` selects the former monochromatic one. The neutral-ramp
  mapping itself changes no declaration.

- An unknown or removed flag now exits 1 with the parser's own message instead
  of a stack trace, and a command still using `--scheme` is told to use
  `--neutral-tint <subtle|strong>`.

### Removed
- The public `--scheme` flag, `scheme` palette property, and `SCHEMES` export.
  Passing the removed palette property now fails explicitly.

### Fixed
- A seed at the top of the red wedge no longer falls back to the engine's
  default blue. Its hue rounded to 360, which the engine's own range guard
  rejected, so deep reds such as `#940203` silently produced a blue palette
  with only a console warning. Hue is now wrapped modulo 360 in both
  converters.
- `isValidHex` answers false for a non-string instead of throwing, so a direct
  API call with a bad value gets the package's `Invalid HEX color` message
  rather than a `TypeError`.
- A failed optional skill source now warns and continues without preventing
  successful sources from being installed and documented.
- The CLI no longer presents four color schemes when three produced identical
  theme declarations. The two remaining choices now describe their actual
  effect on the neutral gray ramp.
- The isolated artifact publication dry-run now uses a synthetic unpublished
  version, so `npm test` remains repeatable after the real version is already
  published.

## [0.4.0] - 2026-08-09

Publication evidence is recorded in `docs/verification/releases.md`. Local
release-readiness evidence is recorded separately in
`docs/verification/local-0.4.0.md`.

### Added
- Deterministic desired-contract coverage for all 18 palette preset and format
  combinations, including alpha syntax and exact approved token-name and
  custom-palette override mappings.

### Changed
- The shadcn preset now exposes its Card, Popover, chart, Sidebar, and radius
  contracts. It emits 81 color names in both modes plus root-level
  `--radius`, while retaining `--destructive-foreground` for compatibility.
- The radix preset is now labeled `Radix Themes custom-palette tokens` and
  emits the 57-name custom-palette override contract plus 26 existing Larsen
  tokens. CSS Variables remains the generic 50-name preset.
- Current palette documentation now describes the implemented 82/81, 83, and
  50-name contracts. The dated audit remains research and provenance input.

### Fixed
- Eight-digit HEX and CSS color alpha is preserved in HEX, RGB, HSL, HSL
  Values, OKLAB, and OKLCH output instead of being discarded by the RGB and
  HSL helper paths.
- Card, Popover, and Sidebar aliases stay aligned after the baked default
  theme applies its final brand background, foreground, and ring overrides.
- Mechanical shadcn contrast verification now includes Card and Popover text
  in both generated modes.
- Custom shadcn primary and ring roles now retain the requested seed only when
  it reaches their 1.5 and 3 contrast floors. Otherwise the closest passing
  accent-scale value is used, and primary foreground is recomputed with the
  existing scale-first chooser.
- Radix accent contrast now keeps the upstream value only when it reaches 4.5
  against accent step 9, otherwise using the scale-first foreground chooser.
- HSL and HSL Values now retain up to four decimal places instead of rounding
  every component to an integer, preventing serialization from lowering a
  passing foreground pair below 4.5.
- Release-style smoke coverage now scaffolds shadcn, Radix custom-palette, and
  generic CSS Variables artifacts and asserts their 82/81, 83, and 50-name
  contracts plus representative Radix alpha syntax.

---

## [0.3.0] - 2026-08-09

Publication evidence is recorded separately in `docs/verification/releases.md`.

### Added
- A machine-readable wrapper option contract that drives parsing, help,
  prompt defaults, and generated documentation tables.
- Explicit `--default-palette`, `--git`, and `--install` flags, including
  conflict and dependency validation for palette modifiers and positive or
  negative flag pairs.
- Focused Node tests for option behavior, generated documentation, overlay
  boundaries, palette contracts, contrast, release packaging, and full-smoke
  argument handling.
- Deterministic current-contract coverage for all 18 palette preset and format
  combinations. shadcn emits 64 names per selector block; radix and
  css-variables each emit 50 and remain declaration-equivalent per format.
- A canonical internal CLI reference, package-only palette reference, exact
  approved-plan provenance, and npm release evidence for 0.1.0 through 0.2.2.

### Changed
- Raised the Node.js requirement to `>=20.12.0` to match the installed
  `@clack/prompts` dependency.
- Pinned create-next-app specs are named truthfully in progress and generated
  output instead of being described as newest stable.
- Release preparation now produces one consumer-clean tarball, runs standard
  smoke against that file, and requires the same reported file for the
  separate install and production-build gate.
- Release packing now refuses dirty release-relevant source and embeds the
  exact committed `gitHead` in the consumer manifest.
- Repository documentation now separates current contract, historical plan,
  version history, and publication evidence. Landing-page and blog state is
  outside this package contract.
- The default-theme command is `npm run gen:theme` with no HEX argument.

### Fixed
- Required-token verification reports each absent token before contrast is
  evaluated.
- Generated-project checks now cover exact `globals.css`, exact installed
  skills documentation, Tailwind artifact absence, and conditional
  `NEXTJS.md` creation.
- Source-directory publication is refused so maintainers publish only a
  verified release tarball.
- `--skills` with `--no-skills`, extra positional names, and explicitly empty
  string options are rejected before scaffolding instead of being discarded
  or replaced by defaults.
- Requested create-next-app specs are serialized as TSX string expressions so
  semver ranges containing JSX punctuation cannot corrupt the welcome page.
- Contrast documentation now states the exact `shadcn` and `hsl-values`
  parser boundary, WCAG thresholds, and non-WCAG visibility floor.

---

## [0.2.2] - 2026-08-08

### Added
- `repository`, `homepage` and `bugs` fields in `package.json`, so the npm page
  links to the source and the issue tracker. Without these the package appeared
  on npm with no way to find the code.
- A root `README.md` written as the project's front door rather than internal
  notes, since it is what GitHub visitors see first.

---

## [0.2.1] - 2026-08-08

### Fixed
- **Wrong page surface with the scale presets.** `radix` and `css-variables` do
  emit `--background` and `--foreground`; the role mapping was pointing the
  page surface at `--gray-1` instead, which is a different colour
  (`#efeeee` vs `#f2f2f2`). `--muted` and `--border` genuinely do not exist in
  those presets and still fall back to the gray scale.
- **The CLI hung without a terminal.** In CI or with a closed stdin the first
  prompt blocked and the process died on Node's unsettled-await warning with
  exit 13 - an error message that told the user nothing. Each prompt is now
  guarded and fails immediately, naming the flag that answers it. Passing every
  flag explicitly still works without `--defaults`.

### Changed
- The welcome page's next steps mention `motion.css`.

---

## [0.2.0] - 2026-08-08

### Added
- **`motion.css`** in the design system: durations named for what moves
  (press 140ms, fast 160ms, ui 200ms, slow 240ms, enter 300ms), four easing
  curves in one file, press and entrance scales, and stagger delays.
- **Type tokens** in `core.css`: unitless leading and size-specific tracking.
- **Optional Larsen Skills install.** A prompt offers the recommended set, all
  nine, or a multi-select. The wrapper verifies requested
  `.agents/skills/<name>/SKILL.md` files. Off by default on `--defaults`.
- `AGENTS.md` in generated projects now lists exactly the skills that were
  installed - skills are installed before the overlay so the docs cannot claim
  something that failed.

### Changed
- **Reduced motion is no longer a blanket kill.** The previous
  `animation-duration: 0.01ms !important` rule also disabled spinners and
  progress indicators. The distance, scale and stagger tokens now collapse to
  zero instead: transitions keep running, movement stops. Continuous decoration
  opts out with `data-motion="decorative"`.
- `base.css` is colour-free; document defaults moved into the generated
  `theme.css` where the real token names are known.
- Images get `height: auto` paired with `max-width`, which `next/image` warned
  about on every page load.

### Fixed
- Multiple skills need one `--skill` flag each. A comma-separated list is
  silently ignored by the installer, which prints its available-skills list and
  still exits 0 - so the result is now verified on disk, not by exit code.

---

## [0.1.1] - 2026-08-07

### Changed
- Changed the baked default seed from `#0A0A0A` to the Larsen Utvikling brand
  blue `#4DA0FF`. The surface pair remained pinned independently from the
  accent seed.

### Fixed
- **Buttons and focus rings were invisible in dark mode.** The engine keeps
  `--primary` and `--ring` at the seed colour in both modes, which is correct
  for a mid-range colour and wrong at the extremes: a near-black seed produced
  near-black on a near-black dark surface, **1.03:1 contrast**. Each mode is now
  generated from the seed that works in it, and an extreme seed is paired with
  its lightness-inverted counterpart. Dark `--primary` went from 1.03:1 to
  18.97:1.
- The default theme's surfaces are pinned to the exact `#FAFAFA`/`#0A0A0A`
  brand pair rather than the generator's derived near-grays.

### Added
- A contrast regression guard in the smoke test, verified by simulating the old
  bug. It checks body text, focus ring and button label against WCAG, and holds
  the button surface only to a visibility floor - a brand accent is allowed to
  sit below the non-text threshold, but nothing is allowed to be invisible.

---

## [0.1.0] - 2026-08-07

First release.

### Added
- Requests the mutable `create-next-app@latest` npm dist-tag
  non-interactively, then overlays the template. TypeScript, App Router,
  `src/` directory, `@/*` import alias, and never Tailwind.
- A vanilla CSS design system in `src/lib/design-system/`: spacing on a 4px
  base, widths, radii, layering, a generated colour theme for both modes, and a
  reset. Reachable through a single import.
- **Colour generated from one HEX** by the rampkit engine, vendored and run
  locally during install. Three presets, six colour formats, four schemes.
- Dark mode with no JavaScript: `prefers-color-scheme` plus a `data-theme`
  override.
- Agent docs in every project: `AGENTS.md` with the rules, `CLAUDE.md` as a
  pointer to it, `DESIGN.md` with the token reference written for the chosen
  palette, and create-next-app's own agent guide preserved as `NEXTJS.md`.
- An interactive prompt flow where every question has a flag, so the whole
  thing runs unattended.
- A smoke test that scaffolds real projects and asserts on the output, wired to
  `prepublishOnly`.

### Notes
- Published under the `@larsen-utvikling` scope. 2FA means releases are run by
  hand.
- The vendored engine carries MIT attribution and its upstream commit in
  `palette/NOTICE.md`.
