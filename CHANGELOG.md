# Changelog

All notable changes to `@larsen-utvikling/create-next-app`.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This
project uses [semantic versioning](https://semver.org/), where a change to what
a generated project contains counts as user-facing.

---

## [Unreleased] - 0.3.0 foundation

0.3.0 exists in the local package manifest and has not been published to npm.

### Added
- A machine-readable wrapper option contract that drives parsing, help,
  prompt defaults, and generated documentation tables.
- Explicit `--default-palette`, `--git`, and `--install` flags, including
  conflict and dependency validation for palette modifiers and positive or
  negative flag pairs.
- Focused Node tests for option behavior, generated documentation, overlay
  boundaries, palette contracts, contrast, release packaging, and full-smoke
  argument handling.
- Deterministic desired-contract coverage for all 18 palette preset and format
  combinations, including alpha syntax and exact framework mappings.
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
- The shadcn preset now exposes its Card, Popover, chart, Sidebar, and radius
  contracts. It emits 81 color names in both modes plus root-level
  `--radius`, while retaining `--destructive-foreground` for compatibility.
- The radix preset is now labeled `Radix Themes tokens` and emits the full
  57-name Radix Themes contract plus 26 existing Larsen tokens. CSS Variables
  remains the generic 50-name preset.

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
- Eight-digit HEX and CSS color alpha is preserved in HEX, RGB, HSL, HSL
  Values, OKLAB, and OKLCH output instead of being discarded by the RGB and
  HSL helper paths.

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
