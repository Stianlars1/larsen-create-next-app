# Design system

This project uses native Tintful tokens generated from `{{PALETTE_SEED}}`.
Preset: `{{PALETTE_PRESET}}`. Format: `{{PALETTE_FORMAT}}`.
Neutral hue: `{{PALETTE_NEUTRAL_TINT}}`.

## Color usage

Use `{{PALETTE_IDIOM}}` and `{{PALETTE_ALPHA_IDIOM}}` for alpha.
Native token roles used by this starter:

- Background: `{{T_BACKGROUND}}`
- Foreground: `{{T_FOREGROUND}}`
- Code surface: `{{T_MUTED}}`
- Accent fill: `{{T_ACCENT_SOLID}}`
- Accent surface: `{{T_ACCENT_SOFT}}`
- Decorative separator: `{{T_LINE}}`

`theme.css` is an unmodified Tintful export. Keep `theme.audit.json` and
`theme.manifest.json` beside it. Their hashes verify original bytes, not later
edits. `document.css` and `src/app/page.css` are separate consumer styling.
The project has no runtime dependency on Tintful. System theme follows the OS;
`data-theme="light"` or `data-theme="dark"` on html overrides it.

Tintful's standard policy checks 4.6 text and 3 non-text contrast for defined
role relationships. This does not certify application WCAG conformance.
Validate your actual text, control boundaries, focus states and backgrounds,
especially when adding opacity, compositing, overlays or custom token values.
A decorative border is not a control boundary. Never infer contrast safety
from a ramp index alone. Native shadcn exports do not contain legacy Larsen
accent/gray ramp names or foreground-subtle.

## Spacing - 8 steps, 4px base

| Token | Value | px |
| --- | --- | --- |
| `--space-1` | 0.25rem | 4 |
| `--space-2` | 0.5rem | 8 |
| `--space-3` | 0.75rem | 12 |
| `--space-4` | 1rem | 16 |
| `--space-5` | 1.5rem | 24 |
| `--space-6` | 2rem | 32 |
| `--space-7` | 3rem | 48 |
| `--space-8` | 4rem | 64 |

## Widths

| Token | Value | Use |
| --- | --- | --- |
| `--width-prose` | 65ch | Long-form text |
| `--width-content` | 48rem | Standard content column |
| `--width-wide` | 80rem | Wide layouts |

## Radius and layering

- Radius: `--radius-sm` 4px, `--radius-md` 8px, `--radius-lg` 16px,
  `--radius-full` pill
- Z-index: `--z-dropdown` 100, `--z-sticky` 200, `--z-overlay` 300,
  `--z-modal` 400, `--z-toast` 500

## Type

| Token | Value | Use |
| --- | --- | --- |
| `--leading-heading` | 1.1 | Headings |
| `--leading-body` | 1.5 | Body copy |
| `--leading-tight` | 1.4 | Floor for anything wrapping to 3+ lines |
| `--tracking-display` | -0.025em | Large display text |
| `--tracking-label` | 0.05em | Small uppercase labels |
| `--tracking-body` | 0 | Reading sizes |

Leading is unitless so it scales with font size. Cap long-form measure at
60-75 characters - that is what `--width-prose` (65ch) is for.

## Motion

From `motion.css`. UI motion stays under 300ms; entrances may be slower than
their matching exit (a common pair is `--duration-enter` in, `--duration-fast`
out).

| Token | Value | Use |
| --- | --- | --- |
| `--duration-press` | 140ms | `:active` feedback |
| `--duration-fast` | 160ms | Hover, color and opacity, exits |
| `--duration-ui` | 200ms | Tooltips, dropdowns, menus |
| `--duration-slow` | 240ms | Modals, drawers, sheets |
| `--duration-enter` | 300ms | Entrances |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entrances, exits, direct response |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | Travel between on-screen poses |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | Sheets and drawers |
| `--ease-soft` | `cubic-bezier(0.2, 0, 0, 1)` | Cross-fades |
| `--press-scale` | 0.97 | Press feedback on buttons and cards |
| `--press-scale-subtle` | 0.985 | Press feedback on large surfaces |
| `--enter-scale` | 0.96 | Entrance scale - never animate from `scale(0)` |
| `--enter-distance` | 12px | Entrance `translateY` offset |
| `--enter-blur` | 4px | Optional soft reveal, paired with distance |
| `--stagger-item` | 50ms | Delay between peer items |
| `--stagger-group` | 100ms | Delay between semantic chunks |

Under `prefers-reduced-motion` the distance, scale and stagger tokens
collapse to zero, so transitions keep running while movement stops - reduced
means gentler, not absent. Purely decorative continuous animation should
carry `data-motion="decorative"` so it can be switched off.

## Breakpoints (reference)

Media queries cannot read custom properties - use these values directly:
`480px` (sm), `768px` (md), `1024px` (lg), `1280px` (xl).

## Writing style

Only "-" as a dash in all content. Never use non-ASCII dash characters.
