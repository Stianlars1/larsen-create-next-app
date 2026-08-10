# HANDOFF - 0.5.0 release

Written 2026-08-10. Delete this file once 0.5.0 is published and the landing
page is deployed.

## Status

**0.5.0 is published, deployed and verified.** This file can be deleted once
the optional GitHub Release is decided.

| Step | State |
| --- | --- |
| Package commit | `33ca295` on `origin/main` |
| Tag `v0.5.0` | pushed, peels to `33ca295` |
| npm publication | `0.5.0`, `latest`, published 2026-08-10T09:51:56.334Z |
| Registry artifact | byte-identical to the locally smoked tarball |
| GitHub Release | not created - needs Stian's go-ahead |
| Landing page | `1d7b440` on `origin/main`, live on create-next-app.larsenutvikling.no |
| End-to-end | `npx @larsen-utvikling/create-next-app@0.5.0` scaffolds and passes contrast |

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

## Next steps

Only one, and it is optional: publish a GitHub Release for `v0.5.0`. Not done -
publishing public content is Stian's call. The tag is pushed and
`docs/verification/releases.md` records that no Release exists yet.

## Known and accepted

- `--foreground-subtle` against `--background` measures 4.41 to 4.45 in light
  mode. It is a de-emphasised label colour rather than body text, is unchanged
  from 0.4.0, and is not covered by the contrast gate. Raising it is a
  separate decision about a token that is meant to recede.
- The interactive palette branch was not exercised through a real terminal.
  Driving Clack through a pseudo-terminal stalled on its raw-mode key
  handling. The branch is instead built from the exported
  `PALETTE_PROMPT_CONTRACT`, which both repositories assert against.
