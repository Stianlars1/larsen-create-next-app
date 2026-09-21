# PROJECT.md - @larsen-utvikling/create-next-app

Current package contract. This document describes the behavior implemented in
this repository, not the original plan, release history, or any separate site.

Migration contract: 2026-09-21. See dated verification evidence for completed checks.

## Product boundary

`@larsen-utvikling/create-next-app` is a wrapper around the selected official
`create-next-app` package plus a Larsen Utvikling overlay. It creates a
TypeScript Next.js App Router project with a vanilla CSS design system, agent
documentation, an optional generated palette, optional agent skills,
optional dependency installation, and optional git initialization.

```bash
npx --yes @larsen-utvikling/create-next-app my-app
```

The default upstream spec requests npm's mutable `create-next-app@latest`
dist-tag. That request does not pin or guarantee the version npm resolves or
its stability. The CLI does not bundle or fork Next.js. `--cna-version <spec>`
passes a different npm spec to create-next-app and names the requested spec in
progress and generated-project text.

The package requires Node.js `>=22.20.0`. Network access is required to fetch
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
| Dated local verification | [0.3.0](docs/verification/local-0.3.0.md), [0.4.0](docs/verification/local-0.4.0.md), [0.5.0](docs/verification/local-0.5.0.md), [0.5.1](docs/verification/local-0.5.1.md), [0.6.0](docs/verification/local-0.6.0.md) |
| User-facing version history | [CHANGELOG.md](CHANGELOG.md) |
| Approved 0.1.0 planning snapshot | [docs/plans/2026-08-07-create-next-app-template.md](docs/plans/2026-08-07-create-next-app-template.md) |

README files are entry points, not competing contracts. The CLI tables in the
internal reference and published package README are generated from
`OPTION_CONTRACT`.

## Repository architecture

The root contains the editable masters and the publishable package:

```text
CSS/                           editable design-system master
palette/                       shared integration with published tintful@0.1.1
create-next-app/               publishable npm package
  bin/cli.js                   orchestration
  src/options.js               wrapper option contract
  src/prompts.js               prompt flow and validation
  src/scaffold.js              only create-next-app integration point
  src/overlay.js               preserve, copy, substitute, remove
  src/skills.js                optional multi-source agent skill installation
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

Package code imports the shared `palette/index.js` boundary. Tintful 0.1.1 is
an exact runtime dependency of the CLI; generated applications need no engine.
No engine source is copied or forked.

## CLI contract

The complete contract is [docs/reference/cli.md](docs/reference/cli.md). Its
prompt tree is, in order:

1. App name.
2. Default or custom palette, followed by HEX, preset, and format only for a
   custom interactive palette, then neutral tint last with the default
   preselected.
3. Linter.
4. Package manager.
5. Optional agent skills.
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
    theme.audit.json
    theme.manifest.json
    document.css
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
after each source installer returns and credits the source repository. The
starter does not weaken palette contrast with element opacity. Its external
footer link has a visible token-backed focus indicator and a 44px minimum
target height, and decorative swatch chips are hidden from assistive
technology.

Generated projects are copies. This package does not update them later.

## Design system contract

`src/lib/design-system/index.css` imports the five modules in this order:
`core.css`, `theme.css`, `motion.css`, `base.css`, and `document.css`.

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

Unmodified native Tintful CSS, generated from #4DA0FF using strict shadcn,
HSL channels and strong derived neutrals. It follows system dark preference
and explicit `[data-theme]` overrides. The Tailwind bridge is omitted.
`theme.audit.json` and `theme.manifest.json` preserve its audit and serialization
identity. Keep the original artifacts together; modifications invalidate their
original hash relationship. `document.css` supplies consumer body/rule styles.
There are no post-generation surface, ring or brand overrides.

Regenerate with `npm run gen:theme`, then `npm run sync`.

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

The complete native contract is [docs/reference/palette.md](docs/reference/palette.md).
The shared boundary generates, serializes and checks quality with published
`tintful@0.1.1`. Choices are shadcn, radix and canonical; hex, rgb, hsl,
hsl-values, oklab and oklch; neutral hues none, weak and strong. Engine
capabilities determine valid combinations. Radix rejects hsl-values. Custom
neutral defaults to weak; the baked default remains strong. Removed
css-variables/subtle values fail with migration guidance.

Both generation and serialization must succeed and pass export quality. The
shared integration additionally checks final native CSS against consumer
contrast targets and rejects a mismatch without modifying engine output. A
failed-quality artifact is never written, and requested formats never switch
silently. Known Radix fidelity failures can reject otherwise supported syntax.
This is an explicit diagnostic path, not a claim of universal seed support.

Tintful owns its standard 4.6 text and 3 non-text constraints. Consumer checks
separately verify final starter roles and native semantic pairs, including
shadcn ring/input against its three surfaces. Removed legacy token names and
correction algorithms are no longer contractual. A passing theme is not full
application WCAG certification.

`generateThemeCss()` remains a string API. `generateThemeArtifacts()` returns
original files and their serialization manifest; `generateThemePreview()` adds
native canonical ramp data for the demo without changing export bytes.
`usageIdioms()` and `tokenRoles()` make starter CSS match the selected preset
and format. Generated projects remain static copies with no engine dependency.

## Optional agent skills

The built-in catalog has nine skills from
[`Stianlars1/larsen-skills`](https://github.com/Stianlars1/larsen-skills) and
the explicitly approved third-party `transitions-dev` skill from
[`Jakubantalik/transitions.dev`](https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev).
The third-party files are never vendored into Larsen Skills or this package.
They are fetched from Jakub Antalik's repository and remain subject to the
[Transitions.dev terms](https://transitions.dev/terms.html).

`--skills recommended` remains the four recommended Larsen skills.
`--skills all` remains all nine Larsen skills. `transitions-dev` is available
only through the interactive picker or an explicit name such as
`--skills transitions-dev`. A comma-separated explicit list may mix sources.
`--defaults` installs no skills.

The CLI groups requested names by source repository and runs one
`npx skills add <repo>` command per source, with one `--skill` argument per
requested skill. Exit status is insufficient because the installer can exit
successfully without installing the requested set. The CLI therefore verifies
`.agents/skills/<name>/SKILL.md` after each source command and documents only
entries with that file. Sources remain intentionally current rather than
pinned. For every source that installs files, generated documentation records
the upstream HEAD observed at install time when Git can resolve it, plus a
SHA-256 digest of the verified `SKILL.md` contents. The content digest remains
available even when source HEAD resolution is unavailable. This does not
verify any agent-specific discovery or symlink.

Skills are installed before the overlay. A failed optional source produces a
warning and the scaffold continues. Other requested sources still run, and
the generated project never claims a missing skill exists. Its `AGENTS.md` and
README share the same source-aware skills section, so no-skills and
Larsen-only projects do not point to an unselected third-party source.

## Verification boundaries

Different commands prove different things:

| Command | Evidence produced | Does not prove |
| --- | --- | --- |
| `node scripts/generate-cli-reference.mjs --check` | Both generated CLI tables match `OPTION_CONTRACT` | CLI behavior or package publication |
| `npm test` | Focused source behavior, palette contracts, docs, overlay, contrast, and artifact-shape checks | A real upstream scaffold or production build |
| `npm run verify:palette-sweep` | Deterministic 762-seed x 3 neutral-tint shadcn contrast sweep | Release artifact, npm publication, or other preset-format behavior |
| `npm run smoke` | Real generated projects from one release-style tarball with scaffold assertions | Dependency installation and `next build` |
| `npm run pack:release` | One consumer-clean tarball from clean release-relevant source, with exact `gitHead`, plus standard tarball smoke | Full install/build or npm publication |
| `npm run smoke:full -- <same-tarball>` | Sequential npm, pnpm, yarn, and bun install or missing-manager behavior from the supplied artifact, plus `next build` from npm output | npm publication |
| `npm view <exact-version>` after owner publish | Registry metadata for that exact version | Local branch content beyond its recorded `gitHead` |

`pack:release` creates one dedicated `lu-release-candidate-*` directory under
the system temporary directory and reports its absolute tarball path. The full
smoke and owner-run publish must use that same file. Publishing the source
directory is refused. After publication and registry verification,
`npm run release:cleanup -- <same-tarball>` removes only a validated dedicated
candidate directory and refuses repository or other unrecognized paths.
Agents never run `npm publish` or handle 2FA.

Release-relevant source means every tracked or non-ignored untracked
repository path except `docs/verification/local-*.md`. The final
`docs/verification/releases.md` ledger remains release-relevant. Ignored
dependencies and synced package copies are not source; the release packer
recreates those copies from the root masters. Packing refuses when relevant
source is dirty, resolves the full committed HEAD, and writes it as `gitHead`
in the staged consumer manifest. npm packing and tarball publication dry-run
must preserve that exact value. A later evidence-only commit does not change
the already packed artifact or its embedded source identity.

The artifact-shape test uses an isolated synthetic unpublished version for its
publication dry-run. This keeps `npm test` repeatable after the real version
has been published, when npm correctly refuses another dry-run of that exact
version.

## Release flow

```bash
cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run verify:palette-sweep
npm run pack:release
npm run smoke:full -- /absolute/path/reported-by-pack-release.tgz
```

After those local gates, Stian may publish the same reported tarball. Exact
registry verification and tag creation are separate post-publication steps.
After those checks, remove the temporary candidate with:

```bash
npm run release:cleanup -- /absolute/path/reported-by-pack-release.tgz
```

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
