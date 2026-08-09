# AGENTS.md

Rules for working **on** this package. These are not the rules the package
writes into generated projects - those live in
`create-next-app/template/AGENTS.md`.

## Read this first

**[PROJECT.md](PROJECT.md) is the source of truth.** It describes every prompt,
every flag, the architecture, the decisions and their reasons, and what this
package deliberately does not do. Read it before proposing changes, and update
it in the same commit when behaviour changes.

## Non-negotiables

- **Never Tailwind.** Not in the template, not on the landing page, not as an
  option. The design system is vanilla CSS custom properties.
- **Only `-` as a dash.** Never `—` or `–` - in code, docs, commits, or any
  generated content.
- **Clarify, do not guess.** When a decision has more than one defensible
  answer, ask Stian with concrete options and a recommendation. Do not pick a
  direction on a hunch and build it.
- **Everything in this repo is English.** Norwegian belongs in conversation,
  not in files.
- **Never publish to npm.** 2FA is on the account; Stian runs `npm publish`.
  Never ask for or handle an OTP.

## Where to edit

| To change | Edit | Never edit |
| --- | --- | --- |
| Design tokens | `CSS/*.css` | `create-next-app/template/src/lib/design-system/` |
| Colour generation | `palette/index.js` | `create-next-app/palette/` |
| Vendored engine | `palette/engine/` + record it in `palette/NOTICE.md` | anything under `create-next-app/palette/engine/` |
| Wrapper CLI options | `create-next-app/src/options.js` | scattered across other files |
| Published CLI reference | run `create-next-app/scripts/generate-cli-reference.mjs` after editing `options.js` | hand-edit the generated README region |
| Upstream create-next-app flags | `create-next-app/src/scaffold.js` only | scattered across other files |
| What a generated app contains | `create-next-app/template/` | |

`create-next-app/palette/` and `create-next-app/template/src/lib/design-system/`
are **synced copies**, gitignored, overwritten by `scripts/sync.mjs` on every
`prepack`. Editing them loses your work silently.

## Working rules

- **Verify, do not assert.** This project has already shipped two claims that
  turned out to be false ("validated against npm's naming rules", "seven
  questions" beside a list of ten). If you write a factual statement about
  behaviour, check it against the source in the same session.
- **Test the generated app, not the generator.** `npm run smoke` from
  `create-next-app/` scaffolds real projects and asserts on the output. Run it
  before claiming anything works.
- **A default is a decision.** Changing one changes every future project.
  Raise it rather than adjusting it quietly.
- **Contrast is checked, not eyeballed.** The smoke test measures it. A visual
  review missed an invisible dark-mode button once already - the demo page
  simply did not happen to use `--primary`.

## Commands

```bash
npm run gen:theme -- "#4DA0FF"   # regenerate the default theme (repo root)
npm run sync                     # copy masters into the package (repo root)

cd create-next-app
npm test                         # focused behavior + documentation checks
node scripts/generate-cli-reference.mjs --check
npm run smoke                    # packaging + scaffold assertions
npm run smoke:full               # + install and production build
node bin/cli.js my-app           # run the CLI from source
```

## Related documents

- [PROJECT.md](PROJECT.md) - full solution reference
- [CHANGELOG.md](CHANGELOG.md) - what changed in each version
- [docs/plans/](docs/plans) - design notes and the original plan
- `palette/NOTICE.md` - vendored engine attribution and local deviations
