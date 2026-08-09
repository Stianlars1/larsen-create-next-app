# AGENTS.md

Project rules for {{APP_NAME}}. Every AI coding agent working in this repo
must follow them. `CLAUDE.md` points here.

## Hard rules

1. **Never use Tailwind CSS** or any other utility-class framework. This
   project uses vanilla CSS with design tokens - see the design system below.
2. **Only "-" as a dash.** Never use non-ASCII dash characters in code, docs,
   commit messages, UI copy or any generated content.
3. **Never guess.** When a decision is ambiguous or has multiple valid
   approaches, ask the user interactively and let them decide. Do not assume,
   do not go with gut feeling.
4. **All content in English** - code, comments, docs, commits and UI copy.

## Design system

All styling flows from `src/lib/design-system/`:

| File | Contents |
| --- | --- |
| `core.css` | Spacing (8 steps, 4px base), max-widths, radii, type, z-index |
| `theme.css` | Color tokens, light + dark, plus the document defaults |
| `motion.css` | Durations, easing curves, gesture tokens, reduced-motion contract |
| `base.css` | Reset |
| `index.css` | Entry point importing the four above |

The import chain is `src/app/layout.tsx` -> `globals.css` ->
`design-system/index.css`. Do not add styling entry points beside it.

Usage rules:

- Reference tokens, never hardcode values: spacing via `var(--space-*)`,
  radii via `var(--radius-*)`, colors via the tokens in `theme.css`.
- Color usage idiom for this project: `{{PALETTE_IDIOM}}`
  (alpha variant: `{{PALETTE_ALPHA_IDIOM}}`).
- Semantic roles for this project's palette ({{PALETTE_PRESET}} x
  {{PALETTE_FORMAT}}): background `{{T_BACKGROUND}}`, text `{{T_FOREGROUND}}`,
  subtle background `{{T_MUTED}}`, strong accent `{{T_ACCENT_SOLID}}`, soft
  accent `{{T_ACCENT_SOFT}}`, borders `{{T_LINE}}` - full mapping in DESIGN.md.
- Dark mode is automatic (`prefers-color-scheme`) with a manual
  `[data-theme="light" | "dark"]` override on `<html>`. Never ship JS for
  theming without asking first.
- See `DESIGN.md` for the full token reference.

## Motion

Motion tokens are in `motion.css` and encode rules worth keeping:

- UI motion stays under 300ms. Pick the duration by what moves:
  `--duration-press` for `:active`, `--duration-fast` for hover and exits,
  `--duration-ui` for menus, `--duration-slow` for modals and drawers,
  `--duration-enter` for entrances.
- Use the four curves in `motion.css` rather than typing new cubic-beziers.
- Never animate from `scale(0)` - enter from `var(--enter-scale)` with
  `opacity: 0`.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)`;
  touch devices fire hover on tap.
- Reduced motion means gentler, not absent: `motion.css` already collapses
  the distance, scale and stagger tokens, so transitions keep running while
  movement stops. Do not add a blanket `animation: none` rule. Mark purely
  decorative continuous animation with `data-motion="decorative"`.
- Motion is never the only feedback channel - pair it with a color, icon or
  label change.

## Structure

- `src/app/` - App Router routes, layouts and route-level CSS
- `src/lib/design-system/` - the design tokens (edit deliberately)
- `public/larsen-utvikling/` - brand assets

## Commands

- `{{PM_RUN}} dev` - development server
- `{{PM_RUN}} build` - production build
- `{{PM_RUN}} start` - serve the production build

## Next.js guidance

If `NEXTJS.md` exists, it contains the upstream agent guide supplied by
create-next-app - follow it for framework conventions and APIs. The overlay
does not create that file when upstream supplies no `AGENTS.md`.
{{SKILLS_NOTE}}
