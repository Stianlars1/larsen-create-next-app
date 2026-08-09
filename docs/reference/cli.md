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
   - A Yes answer asks for the HEX seed, preset, and format in that order.
   - Scheme is not prompted. It defaults to `analogous` for custom palettes
     and can be changed only with `--scheme` together with `--hex`.
3. Linter - answered by `--linter`, or by its default under `--defaults`.
4. Package manager - answered by `--pm`, or by its default under `--defaults`.
5. Larsen Skills - `--skills` selects `recommended`, `all`, or a comma-separated
   list; `--no-skills` skips installation. Without either, an interactive run
   asks whether to install skills and then which set. `--defaults` installs no
   skills.
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
| `--hex <color>` | Palette seed HEX - implies a custom palette. Conflicts with `--default-palette` |
| `--preset <name>` | Palette preset: `shadcn` \| `radix` \| `css-variables`. Default: `shadcn`. Requires `--hex` |
| `--format <name>` | Color format: `hex` \| `rgb` \| `hsl` \| `hsl-values` \| `oklab` \| `oklch`. Default: `hsl-values`. Requires `--hex` |
| `--scheme <name>` | Color scheme: `analogous` \| `monochromatic` \| `complementary` \| `triadic`. Default: `analogous`. Requires `--hex` |
| `--pm <name>` | Package manager: `npm` \| `pnpm` \| `yarn` \| `bun`. Default: `npm` |
| `--linter <name>` | Linter: `eslint` \| `biome` \| `none`. Default: `eslint` |
| `--skills <list>` | Larsen Skills: recommended, all, or comma-separated names. Default with `--defaults`: `none`. Interactive default: `recommended` |
| `--no-skills` | Skip the Larsen Skills install |
| `--git` | Initialize a git repository. Default: `yes`. Conflicts with `--no-git` |
| `--no-git` | Skip git init. Conflicts with `--git` |
| `--install` | Install dependencies. Default: `yes`. Conflicts with `--no-install` |
| `--no-install` | Skip dependency install. Conflicts with `--install` |
| `--cna-version <spec>` | Select the create-next-app version spec. Default: `latest` |
| `-v, --version` | Print version |
| `-h, --help` | Show this help |
<!-- END GENERATED CLI REFERENCE -->

Additional behavior that is intentionally explicit:

- `--hex` accepts three- or six-digit HEX with or without `#`, then normalizes
  the value before generation.
- `--cna-version` is appended to `create-next-app@<spec>` without resolving or
  rewriting the npm spec. The progress and generated-project claims name a
  non-`latest` spec exactly as supplied. Only `latest` is described as the
  newest stable release.
- Linter choices map directly to upstream `--eslint`, `--biome`, and
  `--no-linter` flags.
- The selected package manager is used only for dependency installation and
  generated commands. The upstream scaffold always runs through `npx`.
- `--no-skills` currently takes precedence if it is combined with `--skills`.
  This pair is not rejected by the current contract.

## Rejected combinations and values

The CLI rejects these pairs before prompting or scaffolding:

- `--default-palette` with `--hex`
- `--git` with `--no-git`
- `--install` with `--no-install`

`--preset`, `--format`, and `--scheme` each require `--hex`. They cannot be
silently applied to the baked default palette. Unknown presets, formats,
schemes, package managers, linters, and skill names are rejected. Invalid HEX
and invalid app names are rejected. Node's argument parser rejects unknown
flags and missing flag values.

## Non-interactive and CI use

Every prompt is guarded by a terminal check. With closed or piped stdin, the
CLI exits with status 1 at the first unanswered question and names the flag
that can answer it. CI must either use `--defaults` or answer every branch
explicitly, including positive or negative palette, skills, git, and install
choices.

Default unattended scaffold:

```bash
npx --yes @larsen-utvikling/create-next-app@0.2.2 ci-app \
  --defaults --no-git --no-install
```

Fully explicit custom scaffold:

```bash
npx --yes @larsen-utvikling/create-next-app@0.2.2 ci-app \
  --hex 4DA0FF --preset shadcn --format hsl-values --scheme analogous \
  --linter eslint --pm npm --no-skills --no-git --no-install
```

Both examples require network access for the package and the selected
create-next-app spec. The test suite exercises the same argument sets with
controlled local command doubles and closed stdin.

## Upstream scaffold boundary

Only `create-next-app/src/scaffold.js` owns upstream arguments. The current
locked set is TypeScript, App Router, `src/`, no Tailwind, the selected linter,
`@/*`, skipped upstream installation, disabled upstream git, and upstream
defaults for any unlisted choice. The wrapper performs its own optional
dependency installation and git initialization after applying the overlay.
