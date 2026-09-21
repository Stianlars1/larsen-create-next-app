# Palette contracts

The shared integration in `palette/index.js` uses published `tintful@0.1.1`.
Tintful owns generation, native token contracts, constraints, serialization and
audit evidence. This repository does not vendor or modify its engine.

## Choices and compatibility

Native strict presets: `shadcn`, `radix`, `canonical`. The former
`css-variables` preset is rejected with migration guidance, not mapped silently.
The CLI format subset is `hex`, `rgb`, `hsl`, `hsl-values`, `oklab`, `oklch`.
`rgb` and `hsl` select Tintful's `rgb-legacy` and `hsl-legacy` syntax.
Supported combinations are read from engine capabilities for strict CSS/sRGB.
Radix does not support HSL channels. `--preset radix` with the global default
`hsl-values` fails and asks for an explicit supported `--format`. Its interactive
format picker excludes channels and initially selects OKLCH.

Neutral choices are `none`, `weak`, `strong`. Custom generation defaults to
`weak`. `subtle` is rejected explicitly; this is not a promise of legacy output
compatibility. Mode generation is Tintful's responsibility. There is no legacy
extreme-seed inversion or consumer contrast correction.

## Public API and files

- `generateThemeArtifacts(options)` returns normalized options, exact CSS,
  artifacts with `text`, hashes and sidecar relationships, the engine's
  serialization reproducibility manifest, and passing quality status.
- `generateThemeCss(options)` returns the exact CSS string for existing callers.
  Applications distributing CSS must also retain the artifacts and manifest.
- `generateThemePreview(options)` additionally returns resolved light/dark token
  maps and canonical ramp maps. These preview ramps do not add legacy token names
  to a shadcn export.
- `supportedFormats(preset)`, `normalizeOptions()`, `isValidHex()`,
  `normalizeHex()`, `usageIdioms()` and `tokenRoles()` are shared helpers.
- `PRESETS`, `FORMATS`, `NEUTRAL_TINTS`, `DEFAULT_THEME` and
  `DEFAULT_CUSTOM_THEME` define consumer choices and defaults.

`scheme`, `darkHex`, `overrides`, `darkOverrides`, and `append` are rejected.
Keep consumer styling separate rather than changing audited output bytes.

`theme.css` and `theme.audit.json` are copied verbatim using Tintful's
`serializedArtifactText()`. `theme.manifest.json` records the serialization
reproducibility object. Keep these files together. Editing CSS invalidates its
original hash/audit relationship. `document.css` supplies body and rule styling
outside the audited artifacts. Starter CSS uses real roles for the chosen preset.
For channels the expression is `hsl(var(--token))`; other formats use `var()`.

CSS uses system preference media handling and explicit `[data-theme]` overrides.
Shadcn explicitly omits the Tailwind bridge. No Tailwind artifact is shipped.

## Default theme

The baked default is `#4DA0FF`, `shadcn`, `hsl-values`, `strong`. Run
`npm run gen:theme`, then `npm run sync`. Its former manually pinned surfaces,
focus colors and brand tokens have been removed. It uses the same unmodified
Tintful pipeline as custom colors.

## Quality boundary

Generation and serialization must both return `ok: true` and
`qualityStatus: "pass"`; every exported artifact must also pass. Failed-quality
output is rejected even when the serializer returns `ok: true`. Diagnostics
identify the seed, preset, syntax, neutral choice and engine failure. There is
no implicit format fallback. Tintful 0.1.1 has known Radix alpha-equivalent
fidelity failures, including #4DA0FF with weak neutral in HEX. The valid syntax
matrix is not a guarantee that every seed exports successfully in every format.

Tintful's standard text target is 4.6 and non-text target is 3 for its defined
role relationships. These do not certify an entire application against WCAG.
The shared integration also rejects output that fails the consumer verifier, even
when engine quality passes. The consumer verifier separately parses final CSS and checks starter text on
canvas and code surfaces, native semantic foreground pairs, shadcn ring/input
against background/card/popover, and Radix accent/gray contrast pairs. It does
not require removed Larsen tokens or legacy correction algorithms. Decorative
borders remain outside control-boundary checks. The former consumer primary
visibility correction is replaced by Tintful's native role policy.

Named seed colors on the demo are shortcuts to this same pipeline. Their
passing exports are audited; a failed export is unavailable, not advertised as
perfect. The demo's final consumer styles require independent contrast checks.

## Verification

`npm test` tests every advertised preset/format/neutral combination using the
brand seed, native byte parity, hash/sidecar relationships, unsupported options,
failed-quality handling, native preview ramps, final consumer contrast and edge
seeds. The deterministic release sweep retains the 762 unique seed corpus
(SHA-256 `25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9`)
and checks shadcn HSL channels under all three neutrals (2,286 exports).
Release packing, actual scaffold/install/build, website parity and browser
behavior are separate verification gates.

## Measured 0.1.1 boundary discrepancy

The consumer's Color.js WCAG 2.1 calculation measures light-mode text pairs
below the exact 4.6 project target for #7B534B (destructive), #5736FE (warning),
and #FE9762 (destructive), under all three neutrals in HSL channels. Ratios are
4.599920231337044, 4.5997560607671, and 4.599677741566318 respectively.
These exceed WCAG AA's 4.5 minimum but do not meet this project's extra margin.
The integration rejects the original export with consumer diagnostics. It does
not alter Tintful colors or lower the target. The release sweep locks these
nine known rejections and fails on new failures or changed rejection behavior.
