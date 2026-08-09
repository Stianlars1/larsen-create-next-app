# PROJECT.md - @larsen-utvikling/create-next-app

Current package contract. This document describes the behavior implemented in
this repository, not the original plan, release history, or any separate site.

Last checked against source and tests: 2026-08-09.

## Product boundary

`@larsen-utvikling/create-next-app` is a wrapper around the selected official
`create-next-app` package plus a Larsen Utvikling overlay. It creates a
TypeScript Next.js App Router project with a vanilla CSS design system, agent
documentation, an optional generated palette, optional Larsen Skills,
optional dependency installation, and optional git initialization.

```bash
npx --yes @larsen-utvikling/create-next-app my-app
```

The default upstream spec requests npm's mutable `create-next-app@latest`
dist-tag. That request does not pin or guarantee the version npm resolves or
its stability. The CLI does not bundle or fork Next.js. `--cna-version <spec>`
passes a different npm spec to create-next-app and names the requested spec in
progress and generated-project text.

The package requires Node.js `>=20.12.0`. Network access is required to fetch
the wrapper, the selected create-next-app spec, dependencies when installation
is enabled, and optional skills.

## Documentation authority

| Subject | Authority |
| --- | --- |
| Current package behavior and boundaries | This file |
| Flags, prompts, defaults, interactions, and CI use | [docs/reference/cli.md](docs/reference/cli.md) |
| Mutable option rows | `create-next-app/src/options.js` `OPTION_CONTRACT` |
| Current palette contracts and boundaries | [docs/reference/palette.md](docs/reference/palette.md) |
| Published version evidence | [docs/verification/releases.md](docs/verification/releases.md) |
| Dated local verification | [0.3.0](docs/verification/local-0.3.0.md), [0.4.0](docs/verification/local-0.4.0.md) |
| User-facing version history | [CHANGELOG.md](CHANGELOG.md) |
| Approved 0.1.0 planning snapshot | [docs/plans/2026-08-07-create-next-app-template.md](docs/plans/2026-08-07-create-next-app-template.md) |

README files are entry points, not competing contracts. The CLI tables in the
internal reference and published package README are generated from
`OPTION_CONTRACT`.

## Repository architecture

The root contains the editable masters and the publishable package:

```text
CSS/                           editable design-system master
palette/                       editable palette master and vendored engine
create-next-app/               publishable npm package
  bin/cli.js                   orchestration
  src/options.js               wrapper option contract
  src/prompts.js               prompt flow and validation
  src/scaffold.js              only create-next-app integration point
  src/overlay.js               preserve, copy, substitute, remove
  src/skills.js                optional Larsen Skills installation
  src/run.js                   child-process boundary
  palette/                     synced package copy, never edit directly
  template/                    generated-project overlay
    src/lib/design-system/     synced package copy, never edit directly
  scripts/                     sync, docs, smoke, contrast, release packing
  test/                        focused behavior and artifact tests
docs/reference/                maintained contracts
docs/verification/             publication evidence and evidence boundaries
docs/plans/                    historical and approved implementation plans
```

`CSS/` and `palette/` are the only editable masters. npm cannot pack files
outside `create-next-app/`, so `create-next-app/scripts/sync.mjs` copies both
masters into the package. Direct package packing runs sync through `prepack`.
The release packer syncs into an isolated staging copy. Smoke and source tests
check that the artifact contains the intended copies.

Package code imports only `palette/index.js`, never `palette/engine/`
directly. Changes to the vendored engine require a corresponding entry in
`palette/NOTICE.md`.

## CLI contract

The complete contract is [docs/reference/cli.md](docs/reference/cli.md). Its
prompt tree is, in order:

1. App name.
2. Default or custom palette, followed by HEX, preset, and format only for a
   custom interactive palette. Scheme is flag-only.
3. Linter.
4. Package manager.
5. Optional Larsen Skills.
6. Git initialization.
7. Dependency installation.

Every prompt has a non-interactive answer. With closed or piped stdin, the CLI
fails at the first unanswered prompt and names the required flag. `--defaults`
answers all prompts, installs no skills, and can be overridden by compatible
explicit flags.

App names are checked by this package's local regex and directory rule. This
is not npm package-name validation. See the canonical CLI reference for the
exact accepted characters, length, and empty-directory behavior.

The wrapper always asks create-next-app for:

```text
--ts --app --src-dir --no-tailwind <selected-linter>
--import-alias @/* --skip-install --disable-git --yes
```

The `npx` invocation also receives its own leading `--yes`. Child stdin is
closed so unexpected upstream prompts fail instead of hanging. The wrapper
then owns overlay, optional installation, and optional git setup.

`@clack/prompts` is the terminal-interface library, not a scaffold engine. It
owns the wrapper's prompt UI and cancellation messages. It also renders the
intro and outro frames, logs, and spinner presentation. The official
create-next-app package remains the scaffold engine. Child stdin is closed
separately by the wrapper's process runner.

## Generated project contract

Every successful overlay writes this structure:

```text
AGENTS.md
CLAUDE.md
DESIGN.md
README.md
NEXTJS.md                     only when upstream supplied AGENTS.md
.agents/skills/               only when requested skills installed
public/larsen-utvikling/
  logo.svg
  logo-dark.svg
  logo-name.svg
  logo-name-dark.svg
src/
  app/
    layout.tsx
    globals.css
    page.tsx
    page.css
  lib/design-system/
    index.css
    core.css
    theme.css
    motion.css
    base.css
```

The overlay preserves an upstream `AGENTS.md` as `NEXTJS.md` before writing
the package's `AGENTS.md`. If upstream supplies no `AGENTS.md`, the overlay
does not invent `NEXTJS.md`. `CLAUDE.md` contains only `@AGENTS.md`.

`src/app/globals.css` is exactly the design-system comment plus one import of
`../lib/design-system/index.css`. The overlay removes the upstream
`page.module.css`, replaces the starter page, and removes upstream branding
SVG files. Installed-skills documentation lists only skills found on disk
after the installer returns.

Generated projects are copies. This package does not update them later.

## Design system contract

`src/lib/design-system/index.css` imports the four modules in this order:
`core.css`, `theme.css`, `motion.css`, and `base.css`.

### core.css

- Spacing: `--space-1` through `--space-8` are 4, 8, 12, 16, 24, 32, 48,
  and 64px expressed in rem.
- Widths: prose 65ch, content 48rem, wide 80rem.
- Radii: 4px, 8px, 16px, and pill.
- Line heights: heading 1.1, body 1.5, tight 1.4.
- Tracking: display -0.025em, label 0.05em, body 0.
- Layers: dropdown 100, sticky 200, overlay 300, modal 400, toast 500.
- Breakpoints are comment-only reference values because media queries cannot
  consume custom properties.

### theme.css

The palette generator emits the same declarations in four selector blocks:

```text
:root                              light
prefers-color-scheme dark :root   dark
[data-theme="light"]              explicit light
[data-theme="dark"]               explicit dark
```

Explicit selectors follow the media query and therefore override it without
JavaScript. A generated document-defaults block supplies body, selection, and
horizontal-rule colors using real tokens for the selected preset and format.

The baked default is `#4DA0FF`, `shadcn`, `hsl-values`, and
`monochromatic`. Its background, foreground, and ring are pinned to the
`#FAFAFA` and `#0A0A0A` surface pair. It also adds `--brand-blue`,
`--brand-blue-soft`, and `--brand-blue-subtle`. Card, Popover, and Sidebar
aliases stay aligned with the final pinned background, foreground, and ring
values. Regenerate that exact default from the repository root with:

```bash
npm run gen:theme
```

Passing a HEX argument deliberately generates a different candidate and is
not the command for reproducing the default contract.

### motion.css

- Durations: press 140ms, fast 160ms, UI 200ms, slow 240ms, enter 300ms.
- Curves: ease-out, ease-in-out, drawer, and soft.
- Gesture and entry tokens: press scales, entry scale, distance, blur, and
  stagger timings.
- Reduced motion collapses movement and stagger tokens while retaining
  transitions. Decorative continuous animation can be disabled through the
  `data-motion="decorative"` selector.

### base.css

The reset is color-free. Palette-dependent document colors belong to the
generated `theme.css` block.

## Palette contract

`palette/index.js` exposes palette generation, normalization, role mapping,
usage idioms, and the supported choice constants. The vendored engine source
and local deviations are recorded in `palette/NOTICE.md`.

Current custom choices are:

- Presets: `shadcn`, `radix`, `css-variables`.
- Formats: `hex`, `rgb`, `hsl`, `hsl-values`, `oklab`, `oklch`.
- Schemes: `analogous`, `monochromatic`, `complementary`, `triadic`.

For an extreme seed, `seedsForModes()` pairs it with a lightness-inverted seed
before export. For every seed, shadcn keeps the selected seed as primary and
ring only when it reaches the role's floor in that mode. Otherwise it selects
the perceptually closest passing accent-scale color. Primary foreground is
then recomputed with the existing accent-scale-first chooser. Radix keeps the
upstream accent contrast only when it reaches 4.5 against accent step 9 and
otherwise uses that same scale-first chooser.

The mechanical CSS verifier parses only `shadcn` with `hsl-values` and checks
both generated modes:

- `--foreground` vs `--background` must reach 4.5.
- `--card-foreground` vs `--card` must reach 4.5.
- `--popover-foreground` vs `--popover` must reach 4.5.
- `--ring` vs `--background` must reach 3.
- `--primary-foreground` vs `--primary` must reach 4.5.
- `--primary` vs `--background` must reach a deliberately non-WCAG 1.5
  visibility floor.

The generator applies these role corrections before serialization, so format
selection cannot bypass them. The CSS parser itself makes no broader
preset-format claim. Representative Radix accent pairs are checked separately
at 4.5 in all six generated formats.

The deterministic 3 x 6 preset-format matrix locks the implemented contracts:
shadcn exposes 81 color names in both modes plus root-level `--radius`, Radix
Themes exposes 83 names in both modes, and CSS Variables remains the generic
50-name contract. Radix alpha scales and surfaces preserve alpha in all six
formats. HSL and HSL Values retain enough component precision to preserve
contrast through serialization. See
[docs/reference/palette.md](docs/reference/palette.md) for exact names,
mappings, serialization, and deliberately deferred P3 output.

## Optional Larsen Skills

`--skills` runs `npx skills add Stianlars1/larsen-skills` with one `--skill`
argument per requested skill. Exit status is insufficient because the
installer can exit successfully without installing the requested set. The CLI
therefore verifies `.agents/skills/<name>/SKILL.md` and documents only entries
with that file. It does not verify any agent-specific discovery or symlink.

Skills are installed before the overlay. A failed optional install produces a
warning and the scaffold continues without claiming those skills exist.

## Verification boundaries

Different commands prove different things:

| Command | Evidence produced | Does not prove |
| --- | --- | --- |
| `node scripts/generate-cli-reference.mjs --check` | Both generated CLI tables match `OPTION_CONTRACT` | CLI behavior or package publication |
| `npm test` | Focused source behavior, palette contracts, docs, overlay, contrast, and artifact-shape checks | A real upstream scaffold or production build |
| `npm run smoke` | Real generated projects from one release-style tarball with scaffold assertions | Dependency installation and `next build` |
| `npm run pack:release` | One consumer-clean tarball from clean release-relevant source, with exact `gitHead`, plus standard tarball smoke | Full install/build or npm publication |
| `npm run smoke:full -- <same-tarball>` | Installation and `next build` from the supplied artifact | npm publication |
| `npm view <exact-version>` after owner publish | Registry metadata for that exact version | Local branch content beyond its recorded `gitHead` |

`pack:release` reports an absolute tarball path. The full smoke and owner-run
publish must use that same file. Publishing the source directory is refused.
Agents never run `npm publish` or handle 2FA.

Release-relevant source means every tracked or non-ignored untracked
repository path except dated evidence under `docs/verification/`. Ignored
dependencies and synced package copies are not source; the release packer
recreates those copies from the root masters. Packing refuses when relevant
source is dirty, resolves the full committed HEAD, and writes it as `gitHead`
in the staged consumer manifest. npm packing and tarball publication dry-run
must preserve that exact value. A later evidence-only commit does not change
the already packed artifact or its embedded source identity.

## Release flow

```bash
cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run pack:release
npm run smoke:full -- /absolute/path/reported-by-pack-release.tgz
```

After those local gates, Stian may publish the same reported tarball. Exact
registry verification and tag creation are separate post-publication steps.
The current published record is in
[docs/verification/releases.md](docs/verification/releases.md). Dated local
release-readiness evidence is in `docs/verification/local-<version>.md`.

## Explicit non-goals

- No Tailwind option, bridge, companion path, or generated Tailwind artifact.
- No CSS framework, CSS-in-JS output, Sass output, or component library.
- No JavaScript theme controller.
- No font selection.
- No automatic updates to existing generated projects.
- No npm publication or OTP handling by an agent. Stian publishes the exact
  verified tarball. Git and GitHub release actions require explicit owner
  authorization.
- No claim of full shadcn component compatibility, full Radix Themes runtime
  compatibility, every upstream token, or the deferred Radix P3 blocks.
- No product-site, blog, domain, or deployment status in this package contract.
