<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="create-next-app/template/public/larsen-utvikling/logo-name-dark.svg">
    <img src="create-next-app/template/public/larsen-utvikling/logo-name.svg" alt="Larsen Utvikling" width="200">
  </picture>
</p>

<h1 align="center">@larsen-utvikling/create-next-app</h1>

<p align="center">
  Scaffold the newest Next.js with a vanilla CSS design system.<br>
  No Tailwind, no CSS framework - just tokens.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@larsen-utvikling/create-next-app"><img alt="npm" src="https://img.shields.io/npm/v/@larsen-utvikling/create-next-app?color=4DA0FF"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@larsen-utvikling/create-next-app?color=4DA0FF"></a>
</p>

```bash
npx @larsen-utvikling/create-next-app my-app
```

## What you get

- **The newest stable Next.js**, fetched at scaffold time - never a pinned version going stale
- **TypeScript, App Router, `src/` directory** - and never Tailwind
- **A vanilla CSS design system** in `src/lib/design-system/`: spacing, widths, type, color and motion tokens, light and dark, with zero JS
- **A color palette generated from one HEX** - a full 12-step accent scale, gray scale and semantic colors in both modes, powered by the [rampkit](https://rampkit.app) engine running locally during install
- **Agent docs** - `AGENTS.md` with the project rules, `CLAUDE.md` pointing at it, `DESIGN.md` with the token reference, and Next.js's own agent guide preserved as `NEXTJS.md`
- **Optional [Larsen Skills](https://github.com/Stianlars1/larsen-skills)** installed into the project, where every coding agent picks them up

Motion tokens follow the `motion-craft` skill, so the design system and the
agent guidance agree on the same numbers - including a reduced-motion
contract that keeps feedback and drops movement, rather than disabling
everything.

## Prompts

| Question | Options |
| --- | --- |
| App name | any valid npm package name |
| Custom 12-step palette? | yes → HEX, framework/style, color format |
| Linter | ESLint, Biome, none |
| Install Larsen Skills? | recommended, all, or pick |
| Package manager | npm, pnpm, yarn, bun |
| git init, install dependencies | yes / no |

Every prompt has a flag, so the whole thing runs unattended:

```bash
npx @larsen-utvikling/create-next-app my-app --defaults
npx @larsen-utvikling/create-next-app my-app --hex 22C55E --pm pnpm --skills recommended
```

Full flag reference: [create-next-app/README.md](create-next-app/README.md).

## Repository layout

This repo holds the published package and the masters it is built from.

| Path | What it is |
| --- | --- |
| [`create-next-app/`](create-next-app) | The published npm package |
| [`CSS/`](CSS) | Master design system - edit tokens here |
| [`palette/`](palette) | Master color generator (rampkit engine, vendored - see [NOTICE](palette/NOTICE.md)) |
| [`docs/plans/`](docs/plans) | Design and implementation notes |

`create-next-app/scripts/sync.mjs` copies both masters into the package, and
runs automatically on `prepack`, so a publish can never ship stale tokens.

## Development

```bash
node create-next-app/bin/cli.js my-app   # run the CLI from source
npm run gen:theme -- "#4DA0FF"           # regenerate the default theme
npm run sync                             # copy masters into the package
cd create-next-app && npm run smoke      # packaging + scaffold assertions
cd create-next-app && npm run smoke:full # + install and production build
```

## License

MIT - see [LICENSE](create-next-app/LICENSE). The vendored color engine
carries its own attribution in [palette/NOTICE.md](palette/NOTICE.md).

---

<p align="center">
  <a href="https://www.larsenutvikling.no">Built by Stian Larsen - Larsen Utvikling</a>
</p>
