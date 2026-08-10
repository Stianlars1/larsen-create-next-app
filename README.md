<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="create-next-app/template/public/larsen-utvikling/logo-name-dark.svg">
    <img src="create-next-app/template/public/larsen-utvikling/logo-name.svg" alt="Larsen Utvikling" width="200">
  </picture>
</p>

<h1 align="center">@larsen-utvikling/create-next-app</h1>

<p align="center">
  Request create-next-app's latest npm dist-tag and add a vanilla CSS design system.<br>
  No Tailwind, no CSS framework - just tokens.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@larsen-utvikling/create-next-app"><img alt="npm" src="https://img.shields.io/npm/v/@larsen-utvikling/create-next-app?color=4DA0FF"></a>
  <a href="create-next-app/LICENSE"><img alt="license" src="https://img.shields.io/npm/l/@larsen-utvikling/create-next-app?color=4DA0FF"></a>
</p>

```bash
npx --yes @larsen-utvikling/create-next-app my-app
```

See the [canonical CLI reference](docs/reference/cli.md) for every flag,
prompt, choice, default, interaction, and invalid combination.

## What you get

- **The mutable `create-next-app@latest` npm dist-tag by default**, with
  `--cna-version <spec>` for an explicit upstream spec. This does not guarantee
  which version npm resolves or that it is stable
- **TypeScript, App Router, `src/` directory** - and never Tailwind
- **A vanilla CSS design system** in `src/lib/design-system/`: spacing, widths, type, color and motion tokens, light and dark, with zero JS
- **A color palette generated from one HEX** - a 12-step accent scale, gray scale and semantic colors in both modes, produced locally by the vendored engine. `--neutral-tint subtle|strong` controls how much seed hue reaches the gray ramp and the tokens built on it, and leaves the accent scale unchanged for chromatic seeds. The hueless exceptions are `#000000`, `#010101`, `#FEFEFE`, and `#FFFFFF`
- **Agent docs** - `AGENTS.md` with the project rules, `CLAUDE.md` pointing at it, and `DESIGN.md` with the token reference. Upstream agent guidance is preserved as `NEXTJS.md` only when create-next-app supplies it
- **Optional agent skills from their source repositories** - nine [Larsen Skills](https://github.com/Stianlars1/larsen-skills), plus Jakub Antalik's explicitly selected [`transitions-dev`](https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev), with installation verified only by `.agents/skills/<name>/SKILL.md`

## Prompts

The CLI asks for app name, palette, linter, package manager, optional skills,
git initialization and dependency installation. The app name uses this
package's local lowercase regex and empty-directory check, not npm package-name
validation. Every prompt has a flag, so the whole flow can run unattended:

```bash
npx --yes @larsen-utvikling/create-next-app my-app --defaults
npx --yes @larsen-utvikling/create-next-app my-app --defaults \
  --hex 22C55E --pm pnpm --skills recommended
npx --yes @larsen-utvikling/create-next-app my-app --defaults \
  --skills motion-craft,transitions-dev
```

See the [canonical CLI reference](docs/reference/cli.md) for the exact prompt
tree, choices, defaults, interactions, invalid pairs, and CI requirements.

## Documentation

| File | What it covers |
| --- | --- |
| [PROJECT.md](PROJECT.md) | The current package contract and evidence boundaries |
| [docs/reference/cli.md](docs/reference/cli.md) | Canonical CLI and prompt reference |
| [docs/reference/palette.md](docs/reference/palette.md) | Current palette contracts and boundaries |
| [docs/verification/releases.md](docs/verification/releases.md) | npm evidence for published versions |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [AGENTS.md](AGENTS.md) | Rules for agents and contributors working on this package |

## Repository layout

This repo holds the published package and the masters it is built from.

| Path | What it is |
| --- | --- |
| [`create-next-app/`](create-next-app) | The published npm package |
| [`CSS/`](CSS) | Master design system - edit tokens here |
| [`palette/`](palette) | Master color generator (rampkit engine, vendored - see [NOTICE](palette/NOTICE.md)) |
| [`docs/plans/`](docs/plans) | Design and implementation notes |

`create-next-app/scripts/sync.mjs` copies both masters into the package. Direct
packs run it on `prepack`; the release packer syncs the same masters into an
isolated staging package before it builds the consumer tarball.

## Development

```bash
node create-next-app/bin/cli.js my-app       # run the CLI from source
npm run gen:theme                            # regenerate the default theme
npm run sync                                 # copy masters into the package
cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run verify:palette-sweep
npm run pack:release                         # reports one verified tarball
npm run smoke:full -- /path/reported-by-pack-release.tgz
```

## License

MIT - see [LICENSE](create-next-app/LICENSE). The vendored color engine
carries its own attribution in [palette/NOTICE.md](palette/NOTICE.md).

---

<p align="center">
  <a href="https://www.larsenutvikling.no">Built by Stian Larsen - Larsen Utvikling</a>
</p>
