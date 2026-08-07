# _TEMPLATES

Masters and tooling for the Larsen Utvikling project templates.

## Layout

| Folder | What it is |
| --- | --- |
| `CSS/` | Master design system (`index/core/theme/base.css`) - edit here |
| `palette/` | Master color generator - rampkit engine vendored in `engine/`, API in `index.js` |
| `create-next-app/` | The publishable npm package `@larsen-utvikling/create-next-app` |
| `docs/plans/` | Project plans |

The package contains synced copies of both masters (gitignored) - `npm run
sync` refreshes them, and `prepack` does it automatically on every publish.

## Common commands

```bash
# Regenerate the default theme master from a seed color
npm run gen:theme -- "#4DA0FF"

# Sync masters into the package
npm run sync

# Test everything (from create-next-app/)
npm run smoke        # packaging + scaffold assertions
npm run smoke:full   # + install and production build

# Release (from create-next-app/)
npm version patch && npm publish
```

## Try the CLI locally

```bash
node create-next-app/bin/cli.js my-app
```
