# Plan: Larsen Utvikling template + @larsen-utvikling/create-next-app

Approved 2026-08-07. Norwegian working copy: `~/.claude/plans/vi-er-inne-i-resilient-sketch.md`.
Status: implemented and smoke-tested; awaiting first npm publish.

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
| Default palette seed | `#4DA0FF` = `hsl(212 100% 65%)` (larsenutvikling.no brand blue) |
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
  media-query + `[data-theme]` structure and appends the six app bridge
  tokens (`--surface`, `--on-surface`, `--surface-muted`, `--accent-solid`,
  `--accent-soft`, `--line`) so base.css/page.css work with every
  preset/format combination.
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

## First publish (requires Stian)

1. Create npmjs.com account + free org `larsen-utvikling`, run `npm login`.
2. From `create-next-app/`: `npm publish` (publishConfig handles public
   access; prepublishOnly runs the smoke test automatically).
3. Verify with the exact version from a scratch dir, plus one run of
   `npm create @larsen-utvikling/next-app`.
