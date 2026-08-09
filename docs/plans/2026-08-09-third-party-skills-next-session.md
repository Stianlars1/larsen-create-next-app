# Next session: third-party skills in the CLI and on the site

This file is the prompt for a **new chat**. The work spans two repositories,
the CLI contract, the generated project, the docs and the landing page, so it
does not belong in the session that produced it.

Stian's decision, made 2026-08-09: **install from the authors' own repositories.
Never vendor their skills into `larsen-skills`.** He also wants an audit first,
because `larsen-skills` was itself built on these people's work and the overlap
needs to be understood before anything is added.

---

## Copy everything below into the new chat

I want to add optional third-party agent skills to
`@larsen-utvikling/create-next-app`, and to surface them on the landing page.
This spans two repos, so read both before proposing anything.

- Package: `/Users/stian/Larsen Utvikling/prosjekter/_TEMPLATES`
  (start with `PROJECT.md`, then `AGENTS.md`, then `docs/reference/cli.md`)
- Landing page: `/Users/stian/Developer/nettsider/larsen-create-next-app-site`
  (start with its `AGENTS.md`, then `src/lib/content.ts`)

The skills in question belong to three people:

- **Emil Kowalski** - `animation-vocabulary`, `find-animation-opportunities`,
  `review-animations`, `improve-animations`, `emil-design-eng`
- **Jakub Krehel** - `better-ui`, `better-colors`, `better-layout`,
  `better-writing`, `better-interface`, `better-typography`,
  `better-accessibility`
- **Jakub Antalik** - `transitions-dev`

### Phase 1 - audit before you build anything

My own collection, `Stianlars1/larsen-skills`, was built on these people's
work. Before adding anything I need to know what is genuinely new.

1. Find where each of those skills actually lives upstream. **Do not guess a
   repository URL.** If you cannot establish the real source for one, say so
   and leave it out rather than inventing a path.
2. For each upstream skill, compare it against my nine
   (`motion-craft`, `interface-craft`, `interface-review`,
   `ui-primitive-picker`, `motion-vocabulary`, `liquid-interface`,
   `prototype-lab`, `reverse-engineer-motion`, `animated-logo-cycle`).
   Installed copies are under `~/.claude/skills/`.
3. Produce a table: upstream skill, closest skill of mine, overlap
   (duplicate / overlapping / distinct), and a one-line recommendation.
   `motion-vocabulary` against `animation-vocabulary`, and `interface-review`
   against `review-animations`, are the two I most expect to collide.
4. Record each upstream skill's **licence**. This decides what is even legal,
   and it is the gate on phase 2. Anything without a clear licence does not
   ship.
5. Write the audit to `docs/plans/` in the package repo and stop there. Show me
   the table and let me decide what makes the cut before you write code.

### Phase 2 - only after I approve the audit

**Constraint that overrides convenience: never copy their files into
`larsen-skills`.** The CLI installs from their repositories so attribution
stays intact and they keep owning updates. If a design seems to need vendoring,
stop and ask.

Today `create-next-app/src/skills.js` hardcodes one repo:

    export const SKILLS_REPO = "Stianlars1/larsen-skills";

and `installSkills()` builds `npx --yes skills add <repo> --skill <name> ...`.
That has to become multi-source: skills grouped by source repo, one installer
invocation per repo. Existing behaviour must not change - `--skills recommended`
and `--skills all` keep meaning my nine, so no existing command starts pulling
somebody else's code. Third-party skills are opt-in by explicit name or by a
new flag we agree on.

Keep these properties, which are already load-bearing:
- Exit status is not trusted. The installer can exit 0 having installed
  nothing, so `installSkills` verifies `.agents/skills/<name>/SKILL.md` on disk
  and documents only what actually landed. Preserve that per source.
- A failed optional install warns and continues; it never fails the scaffold.
- Nothing is installed on `--defaults`.
- One failing source must not take the others down with it.

Then update, in the same change:
- `create-next-app/src/options.js` `OPTION_CONTRACT` if the flag surface grows.
  It is the single source for the flags, help text and both generated tables.
- Regenerate the CLI tables:
  `node scripts/generate-cli-reference.mjs` then `--check`.
- `docs/reference/cli.md` prose, `PROJECT.md`, `CHANGELOG.md`, the package
  `README.md`, and the generated project's `AGENTS.md` where it lists skills.
- Tests. `npm test` for the contract, `npm run smoke` for a real scaffold.
  There must be a test proving a third-party source that fails to install does
  not break the ones that succeed.

### Phase 3 - the landing page

The Agent skills section currently renders from `SKILLS` in
`src/lib/content.ts` and reads "Nine skills, installed into the project".
Every number and claim there has to keep matching the shipped CLI - the site
has already shipped false claims twice, so check each statement against
`OPTION_CONTRACT` and `skills.js` rather than against the existing copy.

Credit the three authors by name and link their sources. Their work should not
read as mine.

### House rules for both repos

- Never Tailwind. Vanilla CSS custom properties.
- Only `-` as a dash. Never an em dash or an en dash, anywhere.
- English in all files. Norwegian in conversation only.
- Verify, do not assert. Check claims against source in the same session.
- Never run `npm publish`. I publish; 2FA is on the account.
- Clarify rather than guess. Licensing and attribution are exactly the kind of
  decision to bring back to me.
