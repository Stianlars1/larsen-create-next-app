# Historical plan: Larsen Utvikling template and create-next-app wrapper

Immutable English translation of the approved 0.1.0 implementation plan. This
is a historical planning snapshot, not the current package contract. Later
implementation and release changes are deliberately absent. Read `PROJECT.md`
for current behavior.

## Approval provenance

| Field | Evidence |
| --- | --- |
| Complete session source | `/Users/stian/.claude/projects/-Users-stian-Larsen-Utvikling-prosjekter--TEMPLATES/5c0badbc-cd6e-4e3d-b6cb-f0bb49db3acb.jsonl` |
| Plan proposal tool | `ExitPlanMode` |
| Tool use id | `toolu_01BGrKfraWqoPM55GzeaNVoT` |
| Proposal timestamp | `2026-08-07T20:34:14.605Z` |
| Approval result timestamp | `2026-08-07T20:34:40.052Z` |
| Exact Norwegian source bytes | 17,406 |
| Exact Norwegian source SHA-256 | `962434b7195b84832366439c3ca1f45b1a67869f137ece1b536add03b584d4f3` |

The proposal tool input and approval result contain byte-identical plan text.
The checksum covers the exact JSON string extracted without an added newline
from the approval result's `toolUseResult.plan` field. Audit command:

```bash
jq -j 'select(.timestamp == "2026-08-07T20:34:40.052Z") | .toolUseResult.plan' \
  /Users/stian/.claude/projects/-Users-stian-Larsen-Utvikling-prosjekter--TEMPLATES/5c0badbc-cd6e-4e3d-b6cb-f0bb49db3acb.jsonl \
  | shasum -a 256
```

The exact approved text remains Norwegian in that external session record.
The translation below follows the source section by section and preserves its
planned claims, including values later changed by implementation. It is not a
translation of the repository's evolved plan.

## Plan: Larsen Utvikling template and @larsen-utvikling/create-next-app with Rampkit generator

### Context

Stian wants a reusable base app: always the newest stable Next.js with App
Router, vanilla CSS design tokens and never Tailwind, agent documentation, and
an integrated color generator taken from his own rampkit.app repository,
installable through npx. `_TEMPLATES/` is empty except for an empty `CSS/`
directory. Node v24.18.0 and npm 11.16.0 are ready.

Everything in the package, template, generated app, README files, CLI prompts,
documentation, and code comments must be English. Norwegian is only for chat.
This approved source plan was Norwegian because it was read in chat.

### Decisions clarified with Stian

| Topic | Approved choice |
| --- | --- |
| Distribution | Publish to npm from day one through `npx @larsen-utvikling/create-next-app` |
| Package name | `@larsen-utvikling/create-next-app`, also enabling `npm create @larsen-utvikling/next-app` |
| App language | TypeScript, with all content in English |
| Package manager | Ask on every CLI run: npm, pnpm, yarn, or bun |
| Spacing | Eight steps on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64, described as the Radix curve without the 40px step |
| CSS modules | `core.css`, `theme.css`, and `base.css`, collected by `index.css` in `src/lib/design-system/` |
| Dark mode | Automatic `prefers-color-scheme` plus `[data-theme]` override and no JavaScript |
| Colors | Vendor the Rampkit engine into the CLI and offer a custom 12-step palette from one HEX |
| Palette architecture | The user's framework and format choices define the token baseline rather than a locked alias layer |
| Default palette | Generate from the Larsen Utvikling blue found on larsenutvikling.no: `hsl(212 100% 65%)`, approximately `#4DA6FF`, subject to Stian's approval before baking |
| Documentation files | AGENTS.md, CLAUDE.md pointer, DESIGN.md, app README, and preserved CNA guidance as NEXTJS.md |

### Research findings recorded by the plan

The plan recorded create-next-app 16.3.0 with `--ts`, `--app`, `--src-dir`,
`--no-tailwind`, the `--eslint` or `--biome` or `--no-linter` choice,
`--import-alias`, `--skip-install`, `--disable-git`, `--yes`, and
`--agents-md`. It expected create-next-app to produce AGENTS.md and CLAUDE.md
by default and planned to preserve its AGENTS.md as NEXTJS.md.

For Rampkit at `/Users/stian/Developer/nettsider/rampkit`, remote
`github.com/Stianlars1/rampkit-client`, the plan recorded:

- Local main was about 11 months behind remote: local `fd215bd` from September
  2025 and remote main `48d6b33`. GitHub API checks found semantic status
  colors, analogous and complementary palettes, and danger-derived destructive
  colors on remote main. Build step zero was to pull main and recheck the
  engine map.
- The expected engine path was about 8 to 10 files and 1,250 to 1,600 lines:
  `generatePalette` to `generateBaseColors` to `ColorTheory`, color converters,
  Radix generation, and format exporters.
- The call path was functional with no React or DOM requirement. The unused
  DOM-only `getColorFromCSS` helper would be removed. TypeScript aliases would
  be rewritten to relative paths and code would be emitted as plain ESM
  JavaScript.
- Planned engine dependencies were `colorjs.io@0.5.2`,
  `@radix-ui/colors@3.0.0`, and `bezier-easing@2.1.0`, all treated as MIT and
  Node-safe package dependencies that would not enter generated apps.
- Engine exporters included shadcn, radix, css-variables, Tailwind, CSS-in-JS,
  Sass, Material UI, and Chakra UI. Formats included HEX, RGB, HSL, HSL values,
  OKLAB, and OKLCH.
- Known local issues to recheck after pulling were dead OKLAB and OKLCH choices
  that fell back to HEX and a foreground-subtle index difference. The plan
  recorded that remote had already corrected hardcoded destructive color.
- Because the Rampkit repository lacked a LICENSE and its Radix generator was
  MIT-derived, the vendored directory would carry an MIT notice, source URL,
  and commit SHA.

The plan also recorded the existing Larsen Utvikling color idiom as
`hsl(var(--token))`, brand blue as `212 100% 65%`, and black and white vector
logo variants.

### Planned working flow

1. Edit `_TEMPLATES/CSS/` at any time as the master for core, base, and index.
   Regenerate the theme master with `npm run gen:theme -- "#hex"`, then allow
   manual adjustment.
2. On prepack, synchronize root `CSS/` and `palette/` masters into the package
   and fail loudly if sources are missing.
3. Publish changes with `npm version patch && npm publish`.
4. Each `npx @larsen-utvikling/create-next-app` run fetches the newest stable
   Next.js and overlays the modules. A custom palette generates `theme.css`
   during scaffolding.
5. Generated apps are frozen copies and do not update retroactively.

### Planned repository structure

The plan divided the repository into four root areas:

```text
_TEMPLATES/
+-- CSS/                       master design system
|   +-- index.css              imports core, theme, base
|   +-- core.css               spacing, widths, radii, motion, layers
|   +-- theme.css              generated default palette, editable after generation
|   +-- base.css               reset and document defaults
|
+-- palette/                   complete master color generator
|   +-- index.js               only public API
|   +-- generate-default.mjs   regenerates CSS/theme.css
|   +-- NOTICE.md              attribution, commit, local deviations
|   +-- engine/                vendored plain ESM engine
|
+-- create-next-app/           npm package
|   +-- bin/cli.js             orchestration
|   +-- src/                   prompts, scaffold, overlay, process runner
|   +-- palette/               synchronized copy
|   +-- template/              generated-project overlay
|   |   +-- project docs and brand assets
|   |   +-- src/app/
|   |   +-- src/lib/design-system/ synchronized copy
|   +-- scripts/               repository-only sync and smoke tools
|   +-- package metadata, README, LICENSE, gitignore
|
+-- docs/plans/                approved plans
```

The planned sync copied root `CSS/` to the template design-system directory
and root `palette/` to the package palette directory. Prepack ran the sync
because npm could not pack files outside the package directory. Smoke would
assert equality, and synchronized copies would be gitignored.

Package `bin/` and `src/` would import only `palette/index.js`, never engine
internals.

The planned package metadata included a bin entry, ESM, a files list containing
bin, src, palette, and template, public scoped publishing, and a Node engine of
`>=20.9`. The current Node contract differs and is documented in `PROJECT.md`.

### Planned generated app

```text
my-project/
+-- AGENTS.md
+-- CLAUDE.md
+-- DESIGN.md
+-- README.md
+-- NEXTJS.md
+-- public/larsen-utvikling/
|   +-- logo.svg
|   +-- logo-dark.svg
|   +-- logo-name.svg
|   +-- logo-name-dark.svg
+-- src/
    +-- app/
    |   +-- layout.tsx          keeps the Next.js globals import
    |   +-- globals.css         imports only the design-system entry
    |   +-- page.tsx            English token demonstration
    |   +-- page.css
    +-- lib/design-system/
        +-- index.css
        +-- core.css
        +-- theme.css
        +-- base.css
```

### Planned Rampkit integration

#### Interactive palette flow

The approved palette prompts were:

```text
1. Generate custom 12-step palette from a single HEX? [yes/no]
   No uses the baked brand-blue shadcn HSL-values theme.
2. Enter your HEX color
3. Choose framework/style
4. Choose color format
```

HEX would accept forms such as `#4DA6FF` and `4DA6FF`. The selectable presets
would be limited to shadcn, Radix Colors, and CSS Variables because they emit
CSS custom properties. Tailwind was excluded by the product rule. CSS-in-JS,
Material UI, Chakra UI, and Sass were excluded because their output could not
serve as `theme.css`.

The chosen preset and format would define the app's token baseline. Planned
template substitutions included:

- shadcn would use background and foreground tokens, while radix and
  css-variables would use gray-scale endpoints
- HSL values would use `hsl(var(--x))` and slash alpha, while other formats
  would use `var(--x)` and `color-mix` for alpha
- DESIGN.md would document the selected preset, format, and correct idiom

#### Generation and selectors

The planned `palette/index.js` flow was to call `generatePalette`, pass output
to `generateExportCode`, and wrap light and dark declarations as:

```css
:root { /* light */ }
@media (prefers-color-scheme: dark) { :root { /* dark */ } }
[data-theme="light"] { /* light */ }
[data-theme="dark"] { /* dark */ }
```

The explicit selectors would follow the media query so equal specificity and
source order made them win.

#### Vendoring

After approval, build step zero would pull Rampkit main and recheck the engine.
Selected sources would be copied to the root palette engine, aliases rewritten,
types removed, and remaining formatter issues corrected. NOTICE.md would
record the source commit and deviations. The generator would run only while
scaffolding and would not be copied into the generated app.

The default generator would use brand blue, write root `CSS/theme.css`, and
wait for Stian's color approval before baking.

### Planned file content

#### core.css

The planned core values were eight spacing steps, three max widths, small,
medium, large, and pill radii, motion durations of 150, 250, and 400ms with an
ease-out curve, layer tokens for dropdown, sticky, modal, and toast, and
comment-only breakpoints at 480, 768, 1024, and 1280px.

#### base.css

The plan described a minimal modern reset plus token-driven body defaults. It
expected base.css and related starter files to receive palette substitutions.

#### Two README files

The package README would include install commands, prompts, flags, palette
behavior, and publishing flow. The generated app README would include the
responsive logo header, getting-started commands, scripts, structure, a
post-scaffold checklist, stack line, and Larsen Utvikling credit.

#### Generated AGENTS.md and DESIGN.md

Generated-project rules would prohibit Tailwind, require only `-` as a dash,
require interactive clarification instead of guessing, and explain token use
and structure. CLAUDE.md would contain only the AGENTS.md pointer. DESIGN.md
would document tokens, scales, palette choices, usage guidance, and the dash
rule. NEXTJS.md would hold preserved create-next-app guidance.

### Planned complete CLI flow

1. Prompt for app name using the planned npm and empty-directory rules, then
   palette, linter, package manager, git, and install. Flags would bypass each
   prompt, including defaults, package manager, palette choices, negative git,
   and create-next-app version.
2. Spawn `npx` with its own `--yes`, `create-next-app@latest`, name, locked
   TypeScript and App Router flags, no Tailwind, selected linter, alias,
   upstream skip-install and disable-git, and create-next-app's `--yes`.
   Closed stdin would prevent hangs.
3. Preserve create-next-app AGENTS.md as NEXTJS.md, copy and substitute the
   overlay, write the selected theme, replace starter files, and remove
   superseded CSS and SVG files. Resolve the template path with file URLs so
   spaces are safe.
4. Run selected-package-manager installation, warning and continuing when the
   manager is unavailable. Then initialize, add, and commit git, warning on
   failure.
5. On SIGINT, remove only a directory created by this process and only before
   the install phase.

### Planned testing

The smoke script would have development, tarball, and full install-build modes.
It would assert design-system files, the exact globals import, the CLAUDE.md
pointer, no unresolved template variables, no Tailwind dependency, synchronized
master equality, and custom shadcn HSL-values output containing an accent step
and explicit dark selector. PrepublishOnly would run smoke. Manual checks would
generate default and custom apps, start development, and inspect light, dark,
and explicit theme behavior.

### Planned publication

1. Stian would create or confirm the npm organization and log in. Credentials
   would never be handled by the agent. A taken name would require a new joint
   decision.
2. Run `npm pack --dry-run`, then `npm publish` with public scoped access.
3. Verify exact version 0.1.0 from a scratch directory and also test the npm
   create alias.
4. Iterate with `npm version patch && npm publish`.

### Planned build order

0. Pull Rampkit main and recheck the engine map.
1. Initialize git and the package skeleton, including execution from a path
   containing spaces.
2. Recheck current create-next-app help.
3. Implement process and scaffold modules and prove a plain CNA scaffold.
4. Build the complete palette directory and test HEX input to CSS output.
5. Build CSS masters, approve default brand blue, add sync, template files,
   both README files, and logo assets.
6. Implement prompts, parsing, signals, and error handling.
7. Implement install and git steps, then manually run default and custom apps.
8. Implement smoke and prepublishOnly.
9. Publish 0.1.0 after owner organization and login work, then verify it.

### Risks prioritized by the plan

1. create-next-app flag drift - isolate it in scaffold.js, use both `--yes`
   flags, close stdin, smoke before publishing, and keep a version escape hatch.
2. Rampkit drift - pin the vendored commit and update deliberately.
3. Broken tarball - run tarball smoke and dry-run packing and include palette
   and template in the files list.
4. License - include an MIT notice for the Radix-derived work while Stian owns
   the remaining source.
5. Drift between root masters and package copies - prepack sync, equality
   assertions, and gitignored copies.
6. npm organization name unavailable - clarify before locking a replacement.

### Planned follow-up after approval

- Copy an English translation of the plan into `_TEMPLATES/docs/plans/`.
- Save the never-Tailwind, dash, clarification, English-content, vendoring,
  and brand-blue rules as memory.
- Consider separate future work to upstream vendored fixes to Rampkit and add
  a GitHub repository with scheduled smoke verification.
