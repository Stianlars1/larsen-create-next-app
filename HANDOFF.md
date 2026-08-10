# HANDOFF - 0.5.0 release

Written 2026-08-10. Delete this file once 0.5.0 is published and the landing
page is deployed.

## Status

**Package 0.5.0 is published and verified on npm.** The landing page is not
deployed yet.

| Step | State |
| --- | --- |
| Package commit | `33ca295` on `origin/main` |
| Tag `v0.5.0` | pushed, peels to `33ca295` |
| npm publication | `0.5.0`, `latest`, published 2026-08-10T09:51:56.334Z |
| Registry artifact | byte-identical to the locally smoked tarball |
| GitHub Release | not created - needs Stian's go-ahead |
| Landing page | implemented, gated, **not committed or deployed** |

What ships together:

1. Multi-source agent skills, with `transitions-dev` as an explicit
   third-party opt-in installed from Jakub Antalik's own repository.
2. `--scheme` replaced by `--neutral-tint <subtle|strong>`, now also the
   fourth interactive palette question, plus the landing-page controls and
   previews that explain it.
3. Two accessibility and correctness fixes in the generator: the `--input`
   contrast floor and the hue-360 fallback.

Evidence: [docs/verification/local-0.5.0.md](docs/verification/local-0.5.0.md).
Audit that gated the skills work:
[docs/plans/2026-08-09-third-party-skills-audit.md](docs/plans/2026-08-09-third-party-skills-audit.md).

## Generated output changes in 0.5.0

Three, all deliberate, all `shadcn` only except the last:

- `--input` moves from gray-7 (about 1.7:1) to the closest gray clearing 3:1
  against background, card, and popover. WCAG 2.1 SC 1.4.11: the border is
  the only thing identifying a text field, select, or outline button.
  `--border` and `--sidebar-border` keep gray-7 on purpose.
- A seed whose hue rounds to 360 no longer falls back to the engine's default
  blue. Deep reds such as `#940203` now produce a red palette. This affects
  every preset.
- The neutral-ramp mapping itself changes nothing: `subtle` and `strong`
  select exactly the ramps the former `analogous` and `monochromatic` schemes
  produced.

Radix Themes and CSS Variables declarations are otherwise unchanged from
0.4.0.

## Uncommitted work

The package repo is committed and clean at `33ca295`. Everything below is the
landing page, one commit ahead of `origin/main` at `8195236`:

- `src/lib/content.ts`, `src/lib/palette.ts`, `src/types/palette-engine.d.ts`
- `src/components/demo/palette-demo.tsx` and its module CSS
- `src/components/ui/neutral-tint-disclosure.tsx` and its module CSS
- `src/components/features/command-builder.tsx`, `sections.tsx`
- `src/components/theme/site-theme.tsx`, `src/app/layout.tsx`
- `src/styles/design-system/theme.css` - mechanical sync of the package master
- `src/lib/palette.test.mjs`, `src/lib/package-contract.test.mjs`,
  `package.json` test script, `AGENTS.md`, `.claude/launch.json`

## Next steps

1. Landing page: bump `@larsen-utvikling/create-next-app` to `^0.5.0`,
   reinstall so the lockfile points at the published artifact, re-run
   `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, then
   commit, push and deploy. Verify the deployed URL, not the build log.
2. Optional: publish a GitHub Release for `v0.5.0`. Not done - publishing
   public content is Stian's call.

The dependency bump is a hard gate. `src/lib/package-contract.test.mjs` reads
the installed package, so a clean install of `0.4.0` fails it. A deploy cannot
silently ship a page that offers `--neutral-tint` against an engine that
ignores it.

## Known and accepted

- `--foreground-subtle` against `--background` measures 4.41 to 4.45 in light
  mode. It is a de-emphasised label colour rather than body text, is unchanged
  from 0.4.0, and is not covered by the contrast gate. Raising it is a
  separate decision about a token that is meant to recede.
- The interactive palette branch was not exercised through a real terminal.
  Driving Clack through a pseudo-terminal stalled on its raw-mode key
  handling. The branch is instead built from the exported
  `PALETTE_PROMPT_CONTRACT`, which both repositories assert against.
