# AGENTS.md

Mandatory protocol for work on this package. Generated projects receive a
different file from `create-next-app/template/AGENTS.md`.

## Cold start

Before proposing changes or making behavioral claims:

1. Read all of [PROJECT.md](PROJECT.md), not a summary.
2. Read [docs/reference/cli.md](docs/reference/cli.md) for the complete CLI
   contract.
3. Read the evidence relevant to the claim. Published-version evidence is in
   [docs/verification/releases.md](docs/verification/releases.md). Current
   source behavior must be checked against the implementation and the
   verification commands in `PROJECT.md` in the same session.
4. Inspect the worktree and preserve unrelated local changes.

Update `PROJECT.md` in the same commit when behavior changes. Update the CLI
contract in `create-next-app/src/options.js`, then regenerate both CLI tables.
Do not turn a local test result, a packed artifact, or a commit into a claim
about npm publication.

## Non-negotiable rules

- Never add Tailwind, including as an option or generated artifact.
- Use only `-` as a dash. Never use em dash or en dash characters.
- Keep all repository and generated-project content in English.
- Clarify decisions with more than one defensible answer. Do not guess.
- Never publish to npm or handle an npm OTP. Stian publishes.
- Test the generated app and release artifact, not only source helpers.
- The mechanical CSS contrast parser supports only `shadcn` with `hsl-values`:
  `--foreground` and `--foreground-subtle` vs `--background` at 4.5, `--ring` vs `--background` at 3,
  `--card-foreground` vs `--card` at 4.5, `--popover-foreground` vs
  `--popover` at 4.5, `--input` vs each of `--background`, `--card` and
  `--popover` at 3, `--primary-foreground` vs `--primary` at 4.5, and
  `--primary` vs `--background` at the deliberately non-WCAG 1.5 visibility
  floor. `--border` is deliberately not checked: cards and separators are not
  user interface components, so WCAG 2.1 SC 1.4.11 does not apply to their
  outline. The generator applies primary, ring, input, and foreground-subtle
  corrections before all format serialization. Representative Radix accent
  contrast pairs are checked separately at 4.5 in all six formats.

## Edit map

| Change | Edit here | Do not edit |
| --- | --- | --- |
| Design tokens | `CSS/*.css` | `create-next-app/template/src/lib/design-system/` |
| Color generation | `palette/index.js` | `create-next-app/palette/` |
| Vendored engine | `palette/engine/` and `palette/NOTICE.md` | `create-next-app/palette/engine/` |
| Wrapper flags, choices, defaults | `create-next-app/src/options.js` | Hand-maintained option lists |
| Upstream create-next-app arguments | `create-next-app/src/scaffold.js` | Other CLI modules |
| Generated-project contents | `create-next-app/template/` | Synced design-system copy |
| Current package contract | `PROJECT.md` | Historical plan files |
| Published history | `CHANGELOG.md`, `docs/verification/releases.md` | `PROJECT.md` |

The package copies of `palette/` and the design system are gitignored and
overwritten by `npm run sync` and release packing.

## Required commands

```bash
npm run gen:theme                 # regenerate the default theme
npm run sync                      # refresh package copies

cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run verify:palette-sweep
npm run smoke
npm run pack:release              # reports one verified tarball
npm run smoke:full -- /path/reported-by-pack-release.tgz
```

Use the exact tarball reported by `pack:release` for the full smoke and any
later owner-run publish. See `PROJECT.md` for the evidence boundary of each
command.
