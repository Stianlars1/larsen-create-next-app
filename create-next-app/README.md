# @larsen-utvikling/create-next-app

Scaffold the **newest stable Next.js** (App Router, TypeScript) with the Larsen Utvikling design system baked in: vanilla CSS design tokens, agent docs, and an optional 12-step color palette generated from a single HEX.

No Tailwind. No CSS framework. Just tokens.

## Usage

```bash
npx @larsen-utvikling/create-next-app my-app
```

or via the `create` alias:

```bash
npm create @larsen-utvikling/next-app my-app
```

The CLI fetches the latest stable `create-next-app` by default, so the normal
path starts on the newest Next.js. Use `--cna-version <spec>` as an explicit
escape hatch when the upstream latest release breaks.

## What you get

- Newest Next.js, App Router, TypeScript, `src/` directory
- Vanilla CSS design system at `src/lib/design-system/`:
  - `core.css` - spacing scale (8 steps, 4px base), max-widths, radii, type, z-index
  - `theme.css` - full light/dark color theme (auto via `prefers-color-scheme`, manual override via `[data-theme]`, zero JS)
  - `motion.css` - durations, easing curves and gesture tokens, plus a reduced-motion contract that keeps feedback and drops movement
  - `base.css` - modern reset
  - `index.css` - single entry importing all of the above
- Agent docs: `AGENTS.md` (project rules), `CLAUDE.md` (pointer), `DESIGN.md` (token documentation), `NEXTJS.md` (Next.js agent guide, preserved from create-next-app)
- A welcome page demonstrating the tokens
- Optional **custom color palette**: answer one prompt with a HEX color and get a complete 12-step accent scale, gray scale, and semantic colors in both light and dark mode - powered by the [rampkit](https://rampkit.app) engine
- Optional **agent skills**: install the [Larsen Skills](https://github.com/Stianlars1/larsen-skills) collection (UI craft, motion, accessibility, prototyping) into the project, where every agent picks them up

The motion tokens follow the `motion-craft` skill, so the design system and
the agent guidance agree on the same numbers.

## Prompts

The interactive flow asks for the app name, palette, linter, optional Larsen
Skills, package manager, git initialization and dependency installation. The
generated reference below is the canonical list of choices and defaults.

## CLI reference

Every prompt has a flag - useful for scripts and CI:

```bash
npx @larsen-utvikling/create-next-app my-app --defaults --pm npm
```

```bash
npx @larsen-utvikling/create-next-app my-app \
  --hex 4DA6FF --preset shadcn --format hsl-values \
  --linter eslint --pm pnpm --no-git --no-install
```

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

## Requirements

- Node.js >= 20.12.0
- Network access (fetches the selected create-next-app spec, `latest` by default)

## License

MIT - built by [Stian Larsen - Larsen Utvikling](https://www.larsenutvikling.no)
