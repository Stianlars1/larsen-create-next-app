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

The CLI always fetches the latest stable `create-next-app` at run time, so every project starts on the newest Next.js.

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

| Prompt | Choices |
| --- | --- |
| App name | any valid npm package name |
| Generate custom palette from a HEX? | yes / no (no = default Larsen Utvikling theme) |
| HEX color | e.g. `#4DA6FF` or `4DA6FF` |
| Framework/style | shadcn/ui, Radix Colors, CSS Variables |
| Color format | HEX, RGB, HSL, HSL Values, OKLAB, OKLCH |
| Linter | ESLint, Biome, none |
| Install Larsen Skills? | yes / no, then recommended, all, or pick |
| Package manager | npm, pnpm, yarn, bun |
| Git init | yes / no |
| Install dependencies | yes / no |

## Non-interactive usage

Every prompt has a flag - useful for scripts and CI:

```bash
npx @larsen-utvikling/create-next-app my-app --defaults --pm npm
```

```bash
npx @larsen-utvikling/create-next-app my-app \
  --hex 4DA6FF --preset shadcn --format hsl-values \
  --linter eslint --pm pnpm --no-git --no-install
```

| Flag | Description |
| --- | --- |
| `-d, --defaults` | Skip all prompts, use defaults |
| `--hex <color>` | Palette seed HEX (with or without `#`) |
| `--preset <name>` | `shadcn` \| `radix` \| `css-variables` |
| `--format <name>` | `hex` \| `rgb` \| `hsl` \| `hsl-values` \| `oklab` \| `oklch` |
| `--scheme <name>` | `analogous` (default) \| `monochromatic` \| `complementary` \| `triadic` |
| `--pm <name>` | `npm` \| `pnpm` \| `yarn` \| `bun` |
| `--linter <name>` | `eslint` \| `biome` \| `none` |
| `--skills <list>` | `recommended` \| `all` \| comma-separated skill names |
| `--no-skills` | Skip the skills install (the default for `--defaults`) |
| `--no-git` | Skip git init |
| `--no-install` | Skip dependency install |
| `--cna-version <spec>` | Pin the create-next-app version (escape hatch, default `latest`) |

## Requirements

- Node.js >= 20.9
- Network access (fetches `create-next-app@latest`)

## License

MIT - built by [Stian Larsen - Larsen Utvikling](https://www.larsenutvikling.no)
