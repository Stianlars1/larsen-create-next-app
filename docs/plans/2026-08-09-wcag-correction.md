# Palette WCAG correction - pre-change baseline

Date: 2026-08-09. This is a dated rollback and decision record, not the
current palette contract. The pre-correction implementation is commit
`826ac461e2e465129287561af1de64daac392a68`.

## Pre-correction behavior

- shadcn `--primary` and `--ring` use the normalized seed color in both
  modes.
- shadcn `--primary-foreground` uses `getBestForeground()` against the
  seed. That chooser intentionally prefers the highest-contrast color from
  the generated accent scale, then the gray scale, before falling back to
  pure white or black.
- The scale-first foreground choice is deliberate. It retains a related tint
  where that tint reaches 4.5:1 and avoids unnecessarily harsh or visually
  disconnected pure black and white text.
- Radix `--accent-contrast` uses the vendored engine's
  `radix.accentContrast` value. The upstream helper selects it with an APCA
  threshold and commonly returns pure white.
- Radix `--gray-contrast` already uses `getBestForeground()` against gray
  step 9.
- The lightness inversion rule creates separate mode seeds only below 15
  percent or above 85 percent HSL lightness.

## Observed gap

A deterministic pre-release review generated 27 seeds across all four
schemes. Fifteen seeds failed at least one documented shadcn check, including
brand blue, green, orange, yellow, cyan, blue, and the exact lightness
boundaries. The failures were limited to `--ring` against background and
`--primary` against background. Card, Popover, text, semantic, and harmony
pairs passed.

The same review found that upstream Radix `--accent-contrast` can be below
WCAG 2 AA for normal text. Representative ratios were 2.70:1 for
`#4DA0FF`, 2.28:1 for `#22C55E`, and 2.08:1 for `#F59E0B`.

## Approved correction

- Keep the seed unchanged when it reaches the role's minimum in that mode.
- Otherwise choose the perceptually closest passing color from the same
  generated accent scale.
- Require 1.5:1 for shadcn primary visibility and 3:1 for the focus ring.
- Recompute primary foreground through the existing scale-first
  `getBestForeground()` chooser.
- Keep the upstream Radix accent contrast when it reaches 4.5:1. Otherwise
  use the same scale-first foreground chooser against accent step 9.
- Retain pure black or white only as the existing final fallback.

Rolling back the value behavior means restoring the implementation at the
commit above. This note does not authorize reverting later token-name,
serialization, documentation, or release-evidence work.

## Follow-up serialization finding

After the approved role correction, format-level verification found that
integer HSL rounding changed one 4.506 harmony pair to 4.486. The 0.4.0
implementation therefore retains up to four decimal places in HSL and HSL
Values. This preserves the selected scale-first foreground rather than
replacing it with a less related fallback solely because of notation loss.
