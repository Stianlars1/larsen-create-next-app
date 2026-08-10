# HANDOFF - 0.5.0 release

Written 2026-08-10. Delete this file once 0.5.0 is published and the landing
page is deployed.

## Status

0.5.0 is implemented and locally verified in both repositories. **Nothing is
staged, committed, pushed, published, or deployed.**

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

Package repo, on `main` at `9805ac2`:

- Skills: `create-next-app/src/skills.js` (now owns `renderSkillsNote`),
  `src/prompts.js`, `bin/cli.js`, `scripts/smoke.mjs`, tests, plus the audit
  under `docs/plans/`.
- Neutral tint: `palette/index.js`, `palette/generate-default.mjs`,
  `create-next-app/src/options.js`, `src/prompts.js`
  (`PALETTE_PROMPT_CONTRACT`), `CSS/theme.css`,
  `create-next-app/test/neutral-tint.test.mjs`.
- Engine: `palette/engine/export-formats.js`, `color-utils.js`,
  `colorConverters.js`, with `palette/NOTICE.md` deviations 10 and 11.
- `create-next-app/scripts/theme-contrast.mjs` moved to `src/` so the
  published package ships its own contrast checker and the landing page can
  use the same implementation.
- Docs: `AGENTS.md`, `PROJECT.md`, `CHANGELOG.md`, `README.md`,
  `create-next-app/README.md`, `docs/reference/cli.md`,
  `docs/reference/palette.md`, `create-next-app/template/DESIGN.md`,
  `create-next-app/template/README.md`, `docs/verification/local-0.5.0.md`.
- `.gitignore` now ignores `.playwright-mcp/`, which was blocking
  `pack:release`.

Landing page repo, one commit ahead of `origin/main` at `8195236`:

- `src/lib/content.ts`, `src/lib/palette.ts`, `src/types/palette-engine.d.ts`
- `src/components/demo/palette-demo.tsx` and its module CSS
- `src/components/ui/neutral-tint-disclosure.tsx` and its module CSS
- `src/components/features/command-builder.tsx`, `sections.tsx`
- `src/components/theme/site-theme.tsx`, `src/app/layout.tsx`
- `src/styles/design-system/theme.css` - mechanical sync of the package master
- `src/lib/palette.test.mjs`, `src/lib/package-contract.test.mjs`,
  `package.json` test script, `AGENTS.md`, `.claude/launch.json`

`node_modules` currently holds an unsaved local `0.5.0` pack so the gates
could run. `package.json` still declares `^0.4.0` on purpose.

## Next steps

1. Commit the package repo as one release commit. A skills-first split was
   considered and rejected: only `src/skills.js` and the audit document are
   skills-only, while `bin/cli.js`, `src/prompts.js`, `src/options.js`,
   `scripts/smoke.mjs`, the tests, and every document carry both changes
   interleaved. A split would have produced a first commit whose test suite
   fails, which is worse history than one commit that passes.
2. `npm run pack:release` from the clean tree. It reports one tarball path
   and its `gitHead`.
3. `npm run smoke:full -- <that exact path>`. This installs dependencies and
   runs `next build` inside a generated project.
4. Stian publishes that exact tarball. No agent runs `npm publish`; 2FA is on
   the account.
5. Verify the registry: exact version, `gitHead`, and shasum. Record it in
   `docs/verification/releases.md`.
6. Only then, in the landing page repo: bump
   `@larsen-utvikling/create-next-app` to `^0.5.0`, reinstall so the lockfile
   points at the published artifact, and re-run `npm test`, `npm run lint`,
   `npx tsc --noEmit`, `npm run build`.
7. Deploy the landing page and verify the deployed URL, not the build log.

Step 6 is a hard gate. `src/lib/package-contract.test.mjs` reads the installed
package, so a clean install of `0.4.0` fails it. A deploy cannot silently ship
a page that offers `--neutral-tint` against an engine that ignores it.

## Known and accepted

- `--foreground-subtle` against `--background` measures 4.41 to 4.45 in light
  mode. It is a de-emphasised label colour rather than body text, is unchanged
  from 0.4.0, and is not covered by the contrast gate. Raising it is a
  separate decision about a token that is meant to recede.
- The interactive palette branch was not exercised through a real terminal.
  Driving Clack through a pseudo-terminal stalled on its raw-mode key
  handling. The branch is instead built from the exported
  `PALETTE_PROMPT_CONTRACT`, which both repositories assert against.
