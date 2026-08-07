# Plan: Larsen Utvikling template + @larsen-utvikling/create-next-app

Approved 2026-08-07. Norwegian working copy: `~/.claude/plans/vi-er-inne-i-resilient-sketch.md`.
Status: **shipped - v0.1.0 published to npm 2026-08-07** and verified from the
registry (scaffold, custom palette, `npm create` alias, production build).

## Goal

A reusable Next.js base app, installable as `npx @larsen-utvikling/create-next-app`:

- Always the newest stable Next.js (fetched live via `create-next-app@latest`)
- App Router, TypeScript, `src/` directory - never Tailwind
- Vanilla CSS design system (`src/lib/design-system/`): core structural
  tokens, generated color theme (light + dark, zero JS), reset
- Agent docs: AGENTS.md (rules), CLAUDE.md (pointer), DESIGN.md (tokens),
  NEXTJS.md (create-next-app's own agent guide, preserved)
- Optional custom 12-step palette from a single HEX, powered by the vendored
  rampkit engine (github.com/Stianlars1/rampkit-client @ 48d6b33)

## Decisions (locked with Stian)

| Topic | Decision |
| --- | --- |
| Distribution | npm from day one, scoped `@larsen-utvikling/create-next-app` |
| Package manager | CLI asks every run (npm/pnpm/yarn/bun) |
| Spacing | 8 steps, 4px base: 4, 8, 12, 16, 24, 32, 48, 64 |
| Dark mode | `prefers-color-scheme` auto + `[data-theme]` override, no JS |
| Palette architecture | The user's preset/format choice defines the app's token baseline |
| Default palette | Monochromatic from the brand blue `#4DA0FF` (`hsl(212 100% 65%)`), with `--background`/`--foreground`/`--ring` pinned to the exact `#FAFAFA`/`#0A0A0A` pair, plus the `--brand-blue-soft`/`-subtle` tints from larsenutvikling.no |
| Language | Everything in repos and generated apps is English; Norwegian is chat-only |
| Style rules | Never Tailwind; only "-" as dash (never em/en-dash); agents clarify interactively |

## Architecture

Repo root holds two masters, synced into the package at prepack:

```
CSS/          master design system (index/core/theme/base.css) - edit here
palette/      master color generator: index.js API + vendored engine/ + NOTICE.md
create-next-app/
  bin/cli.js  orchestration (prompts -> scaffold -> overlay -> install -> git)
  src/        prompts.js, scaffold.js (only CNA touchpoint), overlay.js, run.js
  palette/    SYNCED copy (gitignored)
  template/   files overlaid onto every new app (design-system dir is SYNCED)
  scripts/    sync.mjs, smoke.mjs
docs/plans/   this document
```

Key mechanisms:

- `scripts/sync.mjs` copies both masters into the package; runs via `prepack`
  and the smoke test asserts byte-equality - stale publishes are impossible.
- `scaffold.js` spawns `npx --yes create-next-app@latest <name> --ts --app
  --src-dir --no-tailwind <linter> --import-alias @/* --skip-install
  --disable-git --yes` with stdin closed - a future CNA prompt fails fast
  instead of hanging. `--cna-version` flag is the escape hatch.
- `overlay.js` renames CNA's AGENTS.md to NEXTJS.md, copies the template with
  `{{VAR}}` substitution, optionally writes a generated theme.css, removes
  superseded CNA files (`force: true`, drift-tolerant).
- `palette/index.js` (`generateThemeCss`) wraps engine output in the
  media-query + `[data-theme]` structure and appends a generated "document
  defaults" block (body, selection, hr) written with the real token names
  and idiom for the chosen preset/format. `tokenRoles(preset, format)` maps
  semantic roles to actual tokens; the overlay substitutes them into
  page.css/page.tsx/docs. No invented alias tokens - base.css is color-free.
- Local engine fixes (documented in palette/NOTICE.md): OKLAB/OKLCH output
  implemented via colorjs.io; DOM-only helper removed.

## Maintenance flows

- Edit tokens: change files in `CSS/`, then `npm version patch && npm publish`
  from `create-next-app/` (prepack syncs, prepublishOnly smoke-tests).
- Regenerate default theme: `npm run gen:theme -- "#HEX"` at the repo root.
- Re-sync rampkit engine: pull the rampkit repo, re-run the vendoring
  (esbuild transpile + import rewrite), re-apply NOTICE.md deviations.
- Verify a publish: `npx @larsen-utvikling/create-next-app@<exact-version>`
  from a scratch dir (npx `@latest` cache can lie).

## Releasing

2FA is enabled on the npm account, so `npm publish` must run in an
interactive terminal (browser auth) - it fails with `EOTP` otherwise:

```bash
cd create-next-app && npm version patch && npm publish
```

`prepublishOnly` runs the smoke test and `prepack` syncs the masters, so a
green run means the published tarball is verified.

Verify afterwards from a clean scratch dir with the **exact** version (the
npx `@latest` cache can lie):

```bash
npx --yes @larsen-utvikling/create-next-app@<version> verify-app --defaults --no-git --no-install
```

Note: a brand-new scoped package 404s for anonymous registry reads for a
couple of minutes (CDN propagation) while authenticated `npm view` already
works. `npmjs.com/package/...` returns 403 to curl (bot protection) - not a
useful health check.
