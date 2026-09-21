# Tintful migration - local release evidence

Verification date: 2026-09-22 (Europe/Oslo), Node 24.18.0.
CLI worktree: /tmp/larsen-cli-tintful. Site: /tmp/larsen-site-tintful.
Published state is recorded separately in releases.md.

## Correction of the initial contrast report

The initial claim that three seeds exposed a Tintful 0.1.1 boundary defect was
incorrect. The consumer used Color.js contrastWCAG21(), which derives luminance
from general XYZ-D65 Y. Its coefficients differ slightly from WCAG's normative
sRGB coefficients 0.2126, 0.7152 and 0.0722. Tintful uses the normative formula.
No engine source or npm engine update is needed for this issue.

The consumer now uses Color.js only for CSS parsing/conversion, followed by the
normative WCAG formula with the 0.04045 linearization threshold. No acceptance
threshold was reduced and no export bytes were altered.

| Seed / light pair | Initial incorrect measurement | Normative WCAG ratio |
| --- | ---: | ---: |
| #7B534B / destructive | 4.599920231337044 | 4.60025885591219 |
| #5736FE / warning | 4.5997560607671 | 4.600182615352269 |
| #FE9762 / destructive | 4.599677741566318 | 4.60002238236111 |

These values are identical for none, weak and strong neutrals. Regression tests
now accept all nine cases. The sweep has no expected-rejection allowlist.
The previous artifact with SHA-256
63b4004cf75eadc926b87540970fc18bf391901d9ba5cb6d7d0cc09815703763 is superseded
and must not be published. Its false-negative consumer guard is corrected.
No defect report was sent to the engine release task.

## Engine and native exports

Published dependency: tintful@0.1.1, Node >=22.20.0.
Integrity: sha512-U9/65CEJAUgRZdvnhett4Fi6FwIyT78tkNAqr46YnOVZMmfkF0mM5gpXbu9IIVkP6CkIlXFExXtvFZ0SVkSyTw==.

30 seeds x 51 capability-supported combinations produced 1,530 native exports:
1,275 passed engine quality and 255 were rejected by the engine's own Radix
alpha-equivalent fidelity checks. These are distinct from the retracted consumer
contrast finding. No Radix failure was bypassed or silently reformatted.
All 18 named seeds passed default shadcn output under all three neutrals.

## Earlier consumer verification retained

Actual installed tarball scaffolding and production builds passed. npm, pnpm
and yarn installed dependencies with recognized lockfiles; bun's missing-manager
fallback was verified. The corrected artifact is rerun through these gates.

Browser verified system light/dark and explicit data-theme override in a real
starter. Light body background/foreground: RGB(249,250,251)/RGB(40,44,48).
Dark: RGB(7,7,8)/RGB(218,222,228).

The website verified Worker execution, rapid-input stale-result protection,
seed picker, Strong/Weak comparisons, 48 swatches, desktop and 390px mobile
layout, clipboard command and actual CSS downloads equal to CLI output for
shadcn, Radix and canonical presets. All copied design-system artifacts match
CLI masters. Invalid input, unsupported syntax and failed engine quality hide
exports and commands and display diagnostics in both controls.

Browser text roles across canvas/muted/card for emerald measured >=8.8898:1;
ring across canvas/card/popover >=4.8448:1. Local console errors were limited to
unavailable Vercel Analytics and font preload warnings.

Corrected source, final candidate and rerun evidence follow below.
