<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/larsen-utvikling/logo-name-dark.svg">
    <img src="public/larsen-utvikling/logo-name.svg" alt="Larsen Utvikling" width="200">
  </picture>
</p>

# {{APP_NAME}}

Built with the Larsen Utvikling Next.js template: {{NEXTJS_CLAIM}},
App Router, TypeScript, and a vanilla CSS design system. No Tailwind, no
CSS framework - just tokens.

## Getting started

```bash
{{PM}} install
{{PM_RUN}} dev
```

Open http://localhost:3000 and start editing `src/app/page.tsx`.

## Scripts

| Command | Description |
| --- | --- |
| `{{PM_RUN}} dev` | Development server |
| `{{PM_RUN}} build` | Production build |
| `{{PM_RUN}} start` | Serve the production build |

## Structure

```
src/
  app/                    App Router routes and layouts
    globals.css           Single import of the design system
    page.tsx              Welcome page - replace it
  lib/design-system/
    index.css             Entry point
    core.css              Spacing, widths, radii, type, z-index
    theme.css             Colors (light + dark) + document defaults
    motion.css            Durations, curves, reduced-motion contract
    base.css              Reset
public/larsen-utvikling/  Brand assets
```

Docs: `DESIGN.md` (token reference) and `AGENTS.md` (project rules for AI
agents). If `NEXTJS.md` exists, it is the upstream agent guide preserved from
create-next-app.

## After scaffolding - checklist

- [ ] Replace the favicon (`src/app/favicon.ico`)
- [ ] Update metadata in `src/app/layout.tsx` (title, description)
- [ ] Tweak the palette in `src/lib/design-system/theme.css` if needed
- [ ] Add project-specific rules to `AGENTS.md`
- [ ] Create `.env.local` if the project needs environment variables
- [ ] Add an Open Graph image (`src/app/opengraph-image.png`)

## Agent skills

The [Larsen Skills](https://github.com/Stianlars1/larsen-skills) collection
covers UI craft, motion, accessibility and prototyping. Installed skills live
in `.agents/skills/` and are symlinked into each agent's own directory.

```bash
npx skills add Stianlars1/larsen-skills   # add or change skills
```

## Tech

{{NEXTJS_CLAIM}} - TypeScript - App Router - vanilla CSS
design tokens

---

<p>
  <a href="https://www.larsenutvikling.no">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="public/larsen-utvikling/logo-dark.svg">
      <img src="public/larsen-utvikling/logo.svg" alt="" width="16" align="top">
    </picture>
    Built by Stian Larsen - Larsen Utvikling
  </a>
</p>
