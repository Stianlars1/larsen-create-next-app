# PROJECT.md - @larsen-utvikling/create-next-app

The complete reference for this solution. If you are an agent or a person
picking this up cold, read this file first: it describes what exists, what it
does, why it does it that way, and what it deliberately does not do. Nothing
here should need to be guessed from the code.

Last verified against the codebase: 2026-08-09.

---

## 1. What this is

An npm-published CLI that scaffolds a Next.js project with a real design
system already in it.

```bash
npx @larsen-utvikling/create-next-app my-app
```

It is a **wrapper plus an overlay**, not a fork. By default it runs the
official `create-next-app@latest` non-interactively, then replaces and adds
files on top. That keeps the default path on the newest stable Next.js without
this package tracking Next.js releases. `--cna-version <spec>` can select a
different create-next-app spec when the upstream latest release breaks.

The audience is primarily Stian Larsen (Larsen Utvikling). It is public and
MIT licensed, but it encodes one person's opinions on purpose.

---

## 2. Where everything lives

| Thing | Location |
| --- | --- |
| Package source | `/Users/stian/Larsen Utvikling/prosjekter/_TEMPLATES` |
| Package repo | https://github.com/Stianlars1/larsen-create-next-app |
| npm package | https://www.npmjs.com/package/@larsen-utvikling/create-next-app |
| Landing page source | `/Users/stian/Developer/nettsider/larsen-create-next-app-site` |
| Landing page repo | https://github.com/Stianlars1/larsen-create-next-app-site |
| Landing page domain | `create-next-app.larsenutvikling.no` (not yet attached in Vercel) |
| Colour engine upstream | https://github.com/Stianlars1/rampkit-client (Stian's own) |
| Skills collection | https://github.com/Stianlars1/larsen-skills (Stian's own) |

### Repo layout

```
_TEMPLATES/
├── PROJECT.md          this file - the source of truth
├── AGENTS.md           rules for agents working ON this package
├── CLAUDE.md           → @AGENTS.md
├── CHANGELOG.md        version history
├── README.md           public front door (GitHub + humans)
│
├── CSS/                MASTER design system - edit tokens HERE
│   ├── index.css       the single entry point
│   ├── core.css        spacing, widths, radii, type, layering
│   ├── theme.css       colour, generated - regenerate, do not hand-edit lightly
│   ├── motion.css      durations, curves, gesture, reduced-motion contract
│   └── base.css        reset, deliberately colour-free
│
├── palette/            MASTER colour generator - edit HERE
│   ├── index.js        the only public API (generateThemeCss, tokenRoles, …)
│   ├── generate-default.mjs   regenerates CSS/theme.css
│   ├── NOTICE.md       MIT attribution + upstream commit + local deviations
│   └── engine/         vendored rampkit, transpiled to plain ESM JS
│
├── create-next-app/    THE PUBLISHED PACKAGE
│   ├── bin/cli.js      orchestration: prompts → scaffold → skills → overlay → install → git
│   ├── src/
│   │   ├── options.js  canonical flags, help text, choices and defaults
│   │   ├── prompts.js  the interactive flow + validation + TTY guards
│   │   ├── scaffold.js THE ONLY FILE THAT KNOWS ABOUT create-next-app
│   │   ├── overlay.js  copy + {{VAR}} substitution + rename/remove
│   │   ├── skills.js   Larsen Skills install
│   │   └── run.js      spawn wrapper (arg arrays, shell:false, output buffer)
│   ├── palette/        SYNCED copy of ../palette (gitignored - never edit)
│   ├── template/       the files overlaid onto every generated project
│   │   └── src/lib/design-system/   SYNCED copy of ../../CSS (gitignored)
│   ├── scripts/
│   │   ├── sync.mjs    copies both masters into the package
│   │   └── smoke.mjs   scaffolds real apps and asserts on the output
│   └── package.json
│
└── docs/plans/         design and implementation notes
```

**The two masters rule:** `CSS/` and `palette/` at the repo root are the
originals. `create-next-app/` contains synced copies because npm cannot pack
files from outside the package folder. `scripts/sync.mjs` copies them, runs
automatically on `prepack`, and the smoke test asserts byte-equality. **Never
edit the copies** - they are gitignored so the mistake is hard to make.

---

## 3. The complete CLI surface

### 3.1 The interactive flow

Seven top-level questions. Three follow-ups appear only if you ask for a
custom palette. Every one has a flag.

| # | Question | Choices (default first) | Flag |
| --- | --- | --- | --- |
| 1 | What is your app named? | any name matching `^[a-z0-9][a-z0-9._-]*$`, ≤214 chars | positional argument |
| 2 | Generate a custom 12-step palette from a single HEX? | No · Yes | `--default-palette` · `--hex <color>` |
| 2a | Enter your HEX color | with or without `#`, 3 or 6 digits | `--hex 4DA0FF` |
| 2b | Choose framework/style | shadcn/ui · Radix Colors · CSS Variables | `--preset shadcn \| radix \| css-variables` |
| 2c | Choose color format | HSL Values · HEX · RGB · HSL · OKLAB · OKLCH | `--format hsl-values \| hex \| rgb \| hsl \| oklab \| oklch` |
| 3 | Which linter? | ESLint · Biome · None | `--linter eslint \| biome \| none` |
| 4 | Install Larsen Skills for AI agents? | Recommended · All · Let me pick · No | `--skills recommended \| all \| a,comma,list` · `--no-skills` |
| 5 | Which package manager? | npm · pnpm · yarn · bun | `--pm npm \| pnpm \| yarn \| bun` |
| 6 | Initialize a git repository? | Yes · No | `--git` · `--no-git` |
| 7 | Install dependencies? | Yes · No | `--install` · `--no-install` |

**Accuracy notes** (these have been got wrong before):

- The name check is **this package's own regex**, not npm's validator. It is
  the character set a folder and a `package.json` name both accept. It also
  refuses a target directory that already contains files (ignoring
  `.DS_Store`).
- The linter answer is **passed straight through to create-next-app** as
  `--eslint` / `--biome` / `--no-linter`, so you get its official config.
- `--defaults` installs **no skills**. Skills are opt-in and an unattended run
  never installs them unless `--skills` is passed explicitly.
- `--scheme` exists as a flag but is **not** a prompt: `analogous` (default),
  `monochromatic`, `complementary`, `triadic`.
- `--default-palette` explicitly answers No to the custom palette question and
  conflicts with `--hex`. `--preset`, `--format` and `--scheme` require
  `--hex`; they are rejected instead of being silently ignored.
- `--git` conflicts with `--no-git`, and `--install` conflicts with
  `--no-install`.
- `--defaults` is a shorthand, not a mode lock. Valid explicit options may
  override its defaults.

### 3.2 Every flag

| Flag | Effect |
| --- | --- |
| `-d, --defaults` | Skip every prompt, take the defaults (no skills) |
| `--default-palette` | Use the default Larsen Utvikling palette |
| `--hex <color>` | Palette seed. Implies a custom palette |
| `--preset <name>` | `shadcn` \| `radix` \| `css-variables` |
| `--format <name>` | `hex` \| `rgb` \| `hsl` \| `hsl-values` \| `oklab` \| `oklch` |
| `--scheme <name>` | `analogous` \| `monochromatic` \| `complementary` \| `triadic` |
| `--linter <name>` | `eslint` \| `biome` \| `none` |
| `--skills <list>` | `recommended` \| `all` \| comma-separated names |
| `--no-skills` | Skip the skills install |
| `--pm <name>` | `npm` \| `pnpm` \| `yarn` \| `bun` |
| `--git` · `--no-git` | Initialize or skip git init. The two forms conflict |
| `--install` · `--no-install` | Install or skip dependencies. The two forms conflict |
| `--cna-version <spec>` | Pin create-next-app instead of `latest` (escape hatch for upstream breakage) |
| `-v, --version` · `-h, --help` | |

### 3.3 Behaviour without a terminal

Each prompt is guarded. In CI or with a piped/closed stdin the CLI exits 1
immediately and names the flag that answers the question. It never hangs.
Passing every flag explicitly works without `--defaults`, including the
positive and negative palette, git and install answers.

---

## 4. What lands in a generated project

```
my-app/
├── AGENTS.md          project rules for agents (never Tailwind, token idiom, motion rules,
│                      dash rule, always-clarify rule) + a list of installed skills
├── CLAUDE.md          contains only `@AGENTS.md`
├── DESIGN.md          token reference, written for the palette preset/format chosen
├── NEXTJS.md          create-next-app's own agent guide, RENAMED not overwritten
├── README.md          getting started + a post-scaffold checklist, commands match the chosen PM
├── .agents/skills/    installed skills (+ symlinked into .claude/skills/)
├── public/larsen-utvikling/   four brand SVGs (logo and logo-with-name, light and dark)
└── src/
    ├── app/
    │   ├── layout.tsx     imports ./globals.css
    │   ├── globals.css    one line: @import "../lib/design-system/index.css";
    │   ├── page.tsx       welcome page demonstrating the tokens
    │   └── page.css
    └── lib/design-system/  index · core · theme · motion · base
```

Removed from the create-next-app output: `src/app/page.module.css`, the
original `src/app/globals.css`, and the branding SVGs in `public/`.

Always passed to create-next-app: `--ts --app --src-dir --no-tailwind
--import-alias @/* --skip-install --disable-git --yes`.

---

## 5. The design system

### core.css
- **Spacing**, 8 steps on a 4px base: 4, 8, 12, 16, 24, 32, 48, 64 (in rem)
- **Widths**: `--width-prose` 65ch, `--width-content` 48rem, `--width-wide` 80rem
- **Radii**: sm 4px, md 8px, lg 16px, full pill
- **Type**: `--leading-heading` 1.1, `--leading-body` 1.5, `--leading-tight` 1.4;
  `--tracking-display` -0.025em, `--tracking-label` 0.05em, `--tracking-body` 0
- **Layering**: dropdown 100, sticky 200, overlay 300, modal 400, toast 500
- Breakpoints are a comment, not tokens - media queries cannot read `var()`

### theme.css (generated)
Emitted by the palette engine. Structure:
```
:root { light }
@media (prefers-color-scheme: dark) { :root { dark } }
[data-theme="light"] { light }   ← after the media query, so it wins
[data-theme="dark"]  { dark }
/* document defaults: body, ::selection, hr - written for the chosen preset/format */
```
Tokens depend on the preset. `shadcn` gives semantic names (`--background`,
`--primary`, …) plus `--accent-1..12`, `--gray-1..12`, and status colours
(`success`/`danger`/`warning`/`info`, each with foreground, muted and border
variants). `radix` and `css-variables` give the scales plus `--background` and
`--foreground`, but no `--muted` or `--border`.

**The default theme** is monochromatic seeded `#0A0A0A`, with `--background`,
`--foreground` and `--ring` pinned to the exact `#FAFAFA`/`#0A0A0A` pair, plus
appended brand accents `--brand-blue: 212 100% 65%`, `--brand-blue-soft`,
`--brand-blue-subtle`. This mirrors larsenutvikling.no exactly.

Regenerate with `npm run gen:theme -- "#HEX"` from the repo root.

### motion.css
- **Durations**: press 140ms, fast 160ms, ui 200ms, slow 240ms, enter 300ms
- **Curves**: `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out`
  `cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)`,
  `--ease-soft` `cubic-bezier(0.2, 0, 0, 1)`
- **Gesture**: `--press-scale` 0.97, `--press-scale-subtle` 0.985,
  `--enter-scale` 0.96, `--enter-distance` 12px, `--enter-blur` 4px
- **Stagger**: `--stagger-item` 50ms, `--stagger-group` 100ms
- **Reduced motion**: distance, scale and stagger tokens collapse to zero.
  Transitions keep running; movement stops. There is deliberately **no**
  blanket `animation-duration: 0.01ms !important` rule, because that also kills
  spinners and progress indicators. Continuous decoration opts out with
  `data-motion="decorative"`.

These values come from the `motion-craft` skill and match larsenutvikling.no.

### base.css
A modern reset, deliberately **colour-free** - every colour rule lives in the
generated `theme.css` so the reset works with any preset/format.

---

## 6. The colour engine

Vendored from rampkit (Stian's own project) at commit
`48d6b33b10ebb38a007cbad67e6ea437b22ccf24`, transpiled from TypeScript to
plain ESM JavaScript with esbuild, `@/*` aliases rewritten to relative paths.

- Public API is `palette/index.js` only. **Never import from `engine/`
  directly** - `bin/` and `src/` go through `index.js`.
- Runtime dependencies: `colorjs.io`, `@radix-ui/colors`, `bezier-easing`
  (all MIT, all Node- and browser-safe). ~95 kB gzipped in a browser bundle.
- Pure functions, no DOM. ~40ms per palette.
- Local deviations from upstream are listed in `palette/NOTICE.md`:
  `getColorFromCSS` removed, and OKLAB/OKLCH output implemented (upstream lists
  both formats but silently falls back to HEX).

### The dual-seed rule (important)

The engine keeps `--primary` and `--ring` at the seed colour in **both** modes.
For a mid-range colour that is correct. For an extreme seed it is not: a
near-black seed produced a near-black primary on a near-black dark surface -
**1.03:1 contrast, invisible buttons and focus rings**.

`seedsForModes()` therefore pairs an extreme seed (lightness <15% or >85%)
with its lightness-inverted counterpart and assigns each to the mode it works
in. Light mode needs a dark accent; dark mode needs a light one. Dark
`--primary` went from 1.03:1 to 18.97:1.

A contrast check runs in the smoke test before every publish. It asserts body
text ≥4.5:1, focus ring ≥3:1, button label ≥4.5:1, and button surface ≥1.5:1 -
the last one deliberately loose, because a brand accent is allowed to sit
below the WCAG non-text threshold as a surface, but nothing is allowed to be
invisible.

---

## 7. Larsen Skills

Nine skills, installed optionally into the scaffolded project.

Recommended set: `motion-craft`, `interface-craft`, `interface-review`,
`ui-primitive-picker`. Also available: `motion-vocabulary`,
`liquid-interface`, `prototype-lab`, `reverse-engineer-motion`,
`animated-logo-cycle`.

Installed with `npx skills add Stianlars1/larsen-skills --skill X --skill Y
--yes`, which writes to the universal `.agents/skills/` and symlinks each
agent's own directory.

**Installer gotcha:** multiple skills need one `--skill` flag **each**. A
comma-separated list is silently ignored - the installer prints its
available-skills list and **still exits 0**. So the result is verified on disk,
not by exit code. Skills are installed *before* the overlay so `AGENTS.md`
lists what actually landed, not what was requested.

---

## 8. Decisions, and why

| Decision | Reason |
| --- | --- |
| Never Tailwind | When every value lives in a class name in markup, the design system stops being an artifact you can look at. Vanilla custom properties keep it as five readable files. |
| Wrap `create-next-app@latest` by default rather than fork | The normal path gets the newest stable Next.js without this package tracking releases, while `--cna-version` remains an explicit escape hatch. |
| All CNA knowledge in one file (`scaffold.js`) | Upstream flag drift is the most likely breakage; it should be a one-line fix. |
| `--yes` twice + `stdin: "ignore"` | First `--yes` is npx's, second is CNA's. Closed stdin makes an unexpected prompt a fast visible error instead of a hang. |
| No invented alias tokens | An earlier version added `--surface`, `--on-surface`, … as a stable layer. Removed: apps now consume the generator's real token names, and `tokenRoles(preset, format)` maps roles for docs and starter CSS. |
| Vendored engine, pinned by commit | The landing page imports it from the published package, so the demo cannot drift from the CLI. |
| Skills opt-in, never on `--defaults` | An unattended run should not reach out to the network for optional extras. |
| Test the generated app, not the generator | The smoke test scaffolds real projects and asserts on the files that come out. |

### What it deliberately does NOT do

- No Tailwind, ever - not a configurable option.
- No JavaScript for theming. Dark mode is CSS only.
- No component library. It ships tokens and a reset, not buttons.
- No font choice. The template uses a system stack; fonts are the project's call.
- No `tailwind`, `css-in-js`, `scss`, `material-ui` or `chakra-ui` palette
  presets, even though the engine supports them - they emit JS or SCSS that
  cannot live in `theme.css`.
- It does not update already-generated projects. They are frozen copies.

---

## 9. Testing

`create-next-app/scripts/smoke.mjs` - runs automatically on `prepublishOnly`.

- **dev mode** (`--dev`): runs `bin/cli.js` directly. Fast.
- **tarball mode** (default): `npm pack`, then `npx ./<tarball>` - catches
  anything the `files` whitelist would have dropped.
- **full mode** (`--full`): also installs and runs `next build` in the
  generated app.

Asserts: all five design-system files exist, `index.css` imports `motion.css`,
`motion.css` has the easing set and the reduced-motion contract, all docs
exist, `CLAUDE.md` is the pointer, `globals.css` is the single import, no
leftover `{{PLACEHOLDERS}}`, no tailwind dependency, masters byte-equal to
their synced copies, contrast passes, a requested skill lands on disk, and
`AGENTS.md` lists exactly the installed skills.

There is also a matrix script kept in the scratchpad during development that
runs every package manager, every linter, several palette combinations and all
invalid-input rejection paths. It is not committed; recreate it when doing a
release sweep.

**npx gotcha:** `npx /absolute/path.tgz` tries to *execute* the tarball
("Permission denied"). Use `npx ./relative.tgz`.

---

## 10. Release process

2FA is enabled on the npm account, so **Stian publishes** - an agent cannot,
and must never handle the OTP.

```bash
cd create-next-app
npm version patch    # or minor
npm publish          # prepack syncs masters, prepublishOnly runs the smoke test
```

Verify afterwards from a clean directory with the **exact** version, because
the npx `@latest` cache can lie:

```bash
npx --yes @larsen-utvikling/create-next-app@<version> verify-app --defaults --no-git --no-install
```

A brand-new scoped package 404s for anonymous registry reads for a couple of
minutes (CDN propagation) while authenticated `npm view` already works.
`npmjs.com/package/...` returns 403 to curl - not a useful health check.

If publish fails with **E404 on PUT**, the auth token has expired. npm hides
401 behind 404 for scoped packages. Fix: `npm login`.

---

## 11. Current state

| | |
| --- | --- |
| Published | 0.1.0, 0.1.1, 0.2.0, 0.2.1, **0.2.2 (current)** |
| Landing page | Built and pushed; domain not yet attached in Vercel, DNS CNAME not yet created |
| Blog posts | Written in `docs/blog/` in the site repo, Norwegian and English, not yet published |

### Known issues, not yet fixed

Verified 2026-08-08 against the upstream sources. Planned work and the exact
questions to answer are in `docs/plans/next-session-prompts.md`.

- **The `shadcn` preset covers 14 of shadcn's 32 official tokens.** Checked
  against `https://ui.shadcn.com/r/colors/neutral.json`. Missing: `--card`,
  `--card-foreground`, `--popover`, `--popover-foreground`, `--radius`,
  `--chart-1..5` and all eight `--sidebar-*`.
  **This is user-facing breakage.** Running `npx shadcn@latest add card` in a
  generated project yields a Card that references `--card`, which does not
  exist. Same for Popover, Chart and Sidebar.
  shadcn has also dropped `--destructive-foreground` in current versions while
  we still emit it - removing it would match upstream but breaks projects
  generated by older versions of this CLI, so it needs a decision.

- **The `radix` preset is missing most of Radix Themes' contract.** Checked
  against `@radix-ui/themes@3.3.0`. We emit `--accent-1..12` and `--gray-1..12`
  but not the alpha scales (`--accent-a1..a12`), `--accent-contrast`,
  `--accent-surface`, `--accent-indicator`, `--accent-track` or
  `--gray-surface`. The engine already computes `accentScaleAlpha`,
  `accentContrast`, `accentSurface` and `graySurface` on every call - they are
  simply never emitted.
  The naming itself is right: 1-12 is Radix's own convention
  (`@radix-ui/colors` ships `blue1`…`blue12`). 50-950 is Tailwind's.

- **`radix` and `css-variables` produce identical output** - the same 50 token
  names, byte for byte. Upstream rampkit's `generateRadixCSS` is
  `return generateCSSVariables(data, format)`, a no-op alias, and the vendored
  engine inherits it. The CLI offers a choice that changes nothing.

- **No test asserts a preset's contract.** The smoke test checks that tokens
  exist and that contrast passes, but nothing checks that the `shadcn` preset
  emits what shadcn actually requires. That is how the gap above survived.

See `CHANGELOG.md` for what changed in each version.

---

## 12. History

The original plan is in `docs/plans/2026-08-07-create-next-app-template.md`.
The short version of how it evolved:

1. **Started** as a scaffolder wrapping `create-next-app@latest` with a vanilla
   CSS design system and agent docs.
2. **Colour** was added by vendoring the rampkit engine so a palette could be
   generated from one HEX at install time.
3. **An alias token layer** was built, then removed - apps use the generator's
   real token names instead.
4. **The default palette** went from blue-seeded, to strictly monochrome, to
   the current monochrome-surfaces-with-blue-accents, after Stian judged pure
   black and white "too much black and white".
5. **A real contrast bug** was found and fixed (the dual-seed rule above).
6. **Motion tokens** and the reduced-motion contract were added from the
   `motion-craft` skill, along with the optional skills install.
7. **A full option matrix** was run, which found the wrong surface token for
   the scale presets and a CLI that hung without a TTY. Both fixed in 0.2.1.
8. **A landing page** was built at `create-next-app.larsenutvikling.no`,
   importing the palette engine from the published package so the demo is
   provably identical to the CLI's output.
