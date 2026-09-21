# @larsen-utvikling/create-next-app

Request create-next-app's mutable `latest` npm dist-tag, then add the Larsen Utvikling design system: vanilla CSS design tokens, agent docs, and an optional 12-step color palette generated from a single HEX.

No Tailwind. No CSS framework. Just tokens.

## Usage

```bash
npx --yes @larsen-utvikling/create-next-app my-app
```

or via the `create` alias:

```bash
npm create @larsen-utvikling/next-app my-app
```

The CLI requests `create-next-app@latest` by default. `latest` is a mutable npm
dist-tag, so this does not pin or guarantee the version npm resolves or its
stability. Use `--cna-version <spec>` to request an explicit upstream spec.

## What you get

- Next.js requested through the selected create-next-app spec, with App Router, TypeScript, and `src/` directory
- Vanilla CSS design system at `src/lib/design-system/`:
  - `core.css` - spacing scale (8 steps, 4px base), max-widths, radii, type, z-index
  - `theme.css` - full light/dark color theme (auto via `prefers-color-scheme`, manual override via `[data-theme]`, zero JS)
  - `motion.css` - durations, easing curves and gesture tokens, plus a reduced-motion contract that keeps feedback and drops movement
  - `base.css` - modern reset
  - `index.css` - single entry importing all of the above
- Agent docs: `AGENTS.md` (project rules), `CLAUDE.md` (pointer), and `DESIGN.md` (token documentation). `NEXTJS.md` preserves upstream guidance only when create-next-app supplies `AGENTS.md`
- A welcome page demonstrating the tokens
- **A color palette generated from one HEX** - native Tintful light/dark tokens, with none, weak or strong neutral hue influence. Generated CSS and audit sidecars stay together; no runtime engine in the app.
- Optional **agent skills**: request entries from [Larsen Skills](https://github.com/Stianlars1/larsen-skills) or Jakub Antalik's [`transitions-dev`](https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev). Each source installs directly from its own repository, and the wrapper verifies only `.agents/skills/<name>/SKILL.md`

## Prompts

The interactive flow asks for the app name, palette, linter, package manager,
optional agent skills, git initialization and dependency installation. The
generated reference below is the complete published list of choices and
defaults. Maintainers use the repository's
[canonical CLI reference](https://github.com/Stianlars1/larsen-create-next-app/blob/main/docs/reference/cli.md)
for prompt conditions, interactions, invalid pairs, and CI behavior.

## CLI reference

Every prompt has a flag - useful for scripts and CI:

```bash
PACKAGE_VERSION=0.7.0 # use after this exact version is published
npx --yes "@larsen-utvikling/create-next-app@${PACKAGE_VERSION}" \
  my-app --defaults --pm npm
```

```bash
PACKAGE_VERSION=0.7.0 # use after this exact version is published
npx --yes "@larsen-utvikling/create-next-app@${PACKAGE_VERSION}" my-app \
  --hex 4DA6FF --preset shadcn --format hsl-values \
  --neutral-tint strong --linter eslint --pm pnpm --no-skills \
  --no-git --no-install
```

<!-- BEGIN GENERATED CLI REFERENCE -->
| Flag | Description |
| --- | --- |
| `-d, --defaults` | Skip all prompts, use defaults (no skills) |
| `--default-palette` | Answer No to a custom palette and use the default palette. Interactive default: `no`. Conflicts with `--hex` |
| `--hex <color>` | Palette seed HEX - implies a custom palette. Value must not be empty. Conflicts with `--default-palette` |
| `--preset <name>` | Palette preset: `shadcn` \| `radix` \| `canonical`. Default: `shadcn`. Value must not be empty. Requires `--hex` |
| `--format <name>` | Color format: `hex` \| `rgb` \| `hsl` \| `hsl-values` \| `oklab` \| `oklch`. Default: `hsl-values`. Value must not be empty. Requires `--hex` |
| `--neutral-tint <name>` | Neutral gray-ramp tint: `none` \| `weak` \| `strong`. Default: `weak`. Value must not be empty. Requires `--hex` |
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

## Requirements

- Node.js >= 22.20.0
- Network access (fetches the selected create-next-app spec, `latest` by default)

## License

MIT - built by [Stian Larsen - Larsen Utvikling](https://www.larsenutvikling.no)
