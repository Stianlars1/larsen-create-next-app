# CLI reference

This is the canonical maintainer reference for the current command-line and
interactive contract. `create-next-app/src/options.js` owns the mutable option
data. The table here and the complete table in the published package README
are generated from its `OPTION_CONTRACT` export.

Regenerate both tables after changing the contract:

```bash
cd create-next-app
node scripts/generate-cli-reference.mjs
node scripts/generate-cli-reference.mjs --check
```

## Invocation and app-name contract

```text
create-next-app [app-name] [options]
```

The first positional argument is the target directory and package name. This
package validates it with its own local rule, not npm's package-name validator:

- 1 to 214 characters
- starts with a lowercase ASCII letter or digit
- remaining characters are lowercase ASCII letters, digits, `.`, `_`, or `-`
- the target directory must be absent or empty, with `.DS_Store` ignored when
  deciding whether an existing directory is empty

Without an argument, an interactive terminal asks for the name. `--defaults`
uses `my-app`. A non-interactive run without either exits with a message that
asks for the positional name.

## Prompt tree

The prompt order and its flag bypasses are:

1. App name - positional argument, or `my-app` with `--defaults`.
2. Palette choice - `--hex` selects a custom palette, while
   `--default-palette` or `--defaults` selects the baked default. Otherwise the
   CLI asks whether to generate a custom palette. The interactive default is
   No.
   - A Yes answer asks for the HEX seed, preset, format, and neutral tint in
     that order.
   - Neutral tint is asked last with `subtle` preselected, so pressing Enter
     keeps the standard gray ramp. `--neutral-tint` answers it directly and
     requires `--hex`.
3. Linter - answered by `--linter`, or by its default under `--defaults`.
4. Package manager - answered by `--pm`, or by its default under `--defaults`.
5. Agent skills - `--skills` answers the branch directly and `--no-skills`
   skips installation. Without either, the interactive branch follows the
   generated skills prompt reference below. `recommended` and `all` retain
   their Larsen-only meanings. Explicit names and the picker can also select
   approved third-party skills. `--defaults` installs no skills.
6. Git initialization - `--git` or `--no-git`; the interactive and
   `--defaults` answer is Yes.
7. Dependency installation - `--install` or `--no-install`; the interactive
   and `--defaults` answer is Yes.

`--defaults` supplies every prompt default but does not lock the result. Valid
explicit flags override it. `--help` and `--version` print and exit before any
prompt or scaffold operation.

## Flags

<!-- BEGIN GENERATED CLI REFERENCE -->
| Flag | Description |
| --- | --- |
| `-d, --defaults` | Skip all prompts, use defaults (no skills) |
| `--default-palette` | Answer No to a custom palette and use the default palette. Interactive default: `no`. Conflicts with `--hex` |
| `--hex <color>` | Palette seed HEX - implies a custom palette. Value must not be empty. Conflicts with `--default-palette` |
| `--preset <name>` | Palette preset: `shadcn` \| `radix` \| `css-variables`. Default: `shadcn`. Value must not be empty. Requires `--hex` |
| `--format <name>` | Color format: `hex` \| `rgb` \| `hsl` \| `hsl-values` \| `oklab` \| `oklch`. Default: `hsl-values`. Value must not be empty. Requires `--hex` |
| `--neutral-tint <name>` | Neutral gray-ramp tint: `subtle` \| `strong`. Default: `subtle`. Value must not be empty. Requires `--hex` |
| `--pm <name>` | Package manager: `npm` \| `pnpm` \| `yarn` \| `bun`. Default: `npm`. Value must not be empty |
| `--linter <name>` | Linter: `eslint` \| `biome` \| `none`. Default: `eslint`. Value must not be empty |
| `--skills <list>` | Agent skills: recommended, all Larsen, or comma-separated names. Default with `--defaults`: `none`. Interactive default: `recommended`. Value must not be empty. Conflicts with `--no-skills` |
| `--no-skills` | Skip agent skill installs. Conflicts with `--skills` |
| `--git` | Initialize a git repository. Default: `yes`. Conflicts with `--no-git` |
| `--no-git` | Skip git init. Conflicts with `--git` |
| `--install` | Install dependencies. Default: `yes`. Conflicts with `--no-install` |
| `--no-install` | Skip dependency install. Conflicts with `--install` |
| `--cna-version <spec>` | Select the create-next-app version spec. Default: `latest`. Value must not be empty |
| `-v, --version` | Print version |
| `-h, --help` | Show this help |
<!-- END GENERATED CLI REFERENCE -->

## Skills prompt reference

This block is generated from the same contract used by `src/prompts.js` and
the same skill records used by `src/skills.js`.

<!-- BEGIN GENERATED SKILLS PROMPT REFERENCE -->
Confirmation: `Install agent skills for AI agents (UI, motion, accessibility, transitions)?`
Interactive default: Yes. A No answer installs nothing.

A Yes answer opens `Which skills?` with these choices:

- `Recommended` (`recommended`) - motion-craft, interface-craft, interface-review, ui-primitive-picker
- `All Larsen Skills` (`all`) - 9 skills
- `Let me pick` (`pick`)

The initial choice is `recommended`. `Let me pick` conditionally opens the multiselect:

- Prompt: `Select skills (space to toggle, enter to confirm)`
- Recommended initial selection: `motion-craft`, `interface-craft`, `interface-review`, `ui-primitive-picker`
- The multiselect is optional; an empty selection is allowed.

Valid comma-separated names for `--skills`: `motion-craft`, `interface-craft`, `interface-review`, `ui-primitive-picker`, `motion-vocabulary`, `liquid-interface`, `prototype-lab`, `reverse-engineer-motion`, `animated-logo-cycle`, `transitions-dev`.
<!-- END GENERATED SKILLS PROMPT REFERENCE -->

Additional behavior that is intentionally explicit:

- `--skills recommended` means the existing four recommended Larsen Skills.
  `--skills all` means the existing nine Larsen Skills. Neither value installs
  third-party code. `transitions-dev` is opt-in by explicit name or through
  `Let me pick`.
- Requested skills are grouped by source repository. The wrapper runs one
  installer command per source, verifies each requested
  `.agents/skills/<name>/SKILL.md`, and documents only files found on disk.
  Sources remain current rather than pinned. For each successful source, the
  generated docs record the upstream HEAD observed at install time when
  available and a SHA-256 digest of the verified `SKILL.md` contents. One
  source failure warns and does not stop the other sources or the scaffold.
- `transitions-dev` installs directly from
  [`Jakubantalik/transitions.dev`](https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev),
  is credited to Jakub Antalik, and remains subject to the
  [Transitions.dev terms](https://transitions.dev/terms.html). No third-party
  skill file is vendored into Larsen Skills or this package.
- `--hex` accepts three- or six-digit HEX with or without `#`, then normalizes
  the value before generation.
- `--cna-version` is appended to `create-next-app@<spec>` without resolving or
  rewriting the npm spec. The progress and generated-project claims name a
  spec exactly as supplied. `latest` is documented only as the mutable npm
  dist-tag that was requested, not a version or stability guarantee.
- Linter choices map directly to upstream `--eslint`, `--biome`, and
  `--no-linter` flags.
- The selected package manager is used only for dependency installation and
  generated commands. The upstream scaffold always runs through `npx`.
  Release full-smoke coverage exercises npm, pnpm, yarn, and bun sequentially.
  An installed manager must create `node_modules` and a recognized lockfile;
  a missing manager must preserve the scaffold and print its manual install
  instruction.

## Prompt presentation and scaffold ownership

`@clack/prompts` is the terminal-interface library used by the wrapper. It
owns the prompt UI and cancellation messages. It also renders intro and outro
frames, logs, and spinner presentation. It does not create the Next.js app.
The selected official create-next-app package remains the scaffold engine.
Child stdin is closed separately by the wrapper's process runner so an
unexpected upstream prompt fails instead of hanging.

## Rejected combinations and values

The CLI rejects these pairs before prompting or scaffolding:

- `--default-palette` with `--hex`
- `--skills` with `--no-skills`
- `--git` with `--no-git`
- `--install` with `--no-install`

`--preset`, `--format`, and `--neutral-tint` each require `--hex`. They cannot
be silently applied to the baked default palette. Unknown presets, formats,
neutral tints, package managers, linters, and skill names are rejected.
Invalid HEX and invalid app names are rejected. Every string flag rejects an
explicitly empty or whitespace-only value. More than one positional app name
is rejected. Node's argument parser rejects unknown flags and missing flag
values; the CLI reports the parser's message on its own and exits 1 instead
of printing a stack trace. A command that still uses the removed `--scheme`
flag is additionally told to use `--neutral-tint <subtle|strong>`.

## Non-interactive and CI use

Every prompt is guarded by a terminal check. With closed or piped stdin, the
CLI exits with status 1 at the first unanswered question and names the flag
that can answer it. CI must either use `--defaults` or answer every branch
explicitly, including positive or negative palette, skills, git, and install
choices.

Default unattended scaffold:

```bash
PACKAGE_VERSION=0.5.0 # use after this exact version is published
npx --yes "@larsen-utvikling/create-next-app@${PACKAGE_VERSION}" ci-app \
  --defaults --no-git --no-install
```

Fully explicit custom scaffold:

```bash
PACKAGE_VERSION=0.5.0 # use after this exact version is published
npx --yes "@larsen-utvikling/create-next-app@${PACKAGE_VERSION}" ci-app \
  --hex 4DA0FF --preset shadcn --format hsl-values --neutral-tint strong \
  --linter eslint --pm npm --no-skills --no-git --no-install
```

Both examples pin the wrapper version instead of relying on its mutable latest
tag. Use them only after the exact package version is published and recorded
in `docs/verification/releases.md`. Both examples require network access for
the package and selected create-next-app spec. The test suite exercises the
same argument sets with controlled local command doubles and closed stdin.

## Upstream scaffold boundary

Only `create-next-app/src/scaffold.js` owns upstream arguments. The current
locked set is TypeScript, App Router, `src/`, no Tailwind, the selected linter,
`@/*`, skipped upstream installation, disabled upstream git, and upstream
defaults for any unlisted choice. The wrapper performs its own optional
dependency installation and git initialization after applying the overlay.
