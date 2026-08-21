# Palette quality and semantic color design

Status: Approved

Date: 2026-08-21

## Context

The current generator already emits semantic status colors and already checks
many color and foreground pairs. Version 0.5.0 added the neutral tint contract,
the input-border contrast correction, and the hue-360 fix. Version 0.5.1 added
the foreground-subtle correction. The latest main branch further expanded the
mechanical verifier to all three presets and all six serialized formats.

The audit confirmed the existing contract on current `origin/main` at
`47dd4cc`:

- 120 focused palette and contrast tests passed.
- The existing 762-seed by 2-tint sweep generated 1,524 shadcn themes with no
  failures.
- An independent audit generated 4,572 HEX themes across all presets, measured
  140,208 expected foreground pairs in 9,144 mode blocks, and found no existing
  contract failures.
- A separate 1,944-theme serialized sample across every preset and format found
  no serialization failures.

The audit also found quality gaps outside the current contract:

- Most foregrounds preserve palette tint and pass WCAG, but several valid pairs
  sit only slightly above 4.5.
- Ring is corrected only against the page background. One measured dark theme
  passed at 3.00 against background but fell to 2.79 against card and 2.49
  against popover.
- Primary is corrected only against the page background. One measured dark
  theme passed the project 1.5 visibility floor against background but fell to
  1.39 against card and 1.25 against popover.
- The Rampkit-derived semantic collision rule can move a role outside its
  expected hue family. A red seed produced yellow danger, an amber seed
  produced red warning, a green seed produced cyan success, and a blue seed
  produced indigo info.
- Explicit token overrides are applied after correction and can bypass the
  generated contrast guarantees. Override color syntax is not currently
  validated independently.

## Goals

- Preserve palette-cohesive foreground colors instead of maximizing contrast
  with pure black or white.
- Raise every generated text-pair target from 4.5 to a project target of 4.6.
- Keep semantic status roles inside recognizable, curated color families.
- Derive semantic scale selection deterministically from the original HEX
  input without modifying the selected curated scale.
- Guarantee ring at 3:1 against background, card, and popover.
- Guarantee primary at the existing non-WCAG 1.5 visibility floor against
  background, card, and popover.
- Preserve every existing preset, format, tint, token name, and CLI choice.
- Keep explicit overrides as an escape hatch while validating their syntax and
  documenting their evidence boundary.
- Extend permanent tests and release verification to cover the new contracts.

## Non-goals

- Do not replace the complete palette engine.
- Do not add Tailwind, a component library, a JavaScript theme controller, or a
  new CLI option.
- Do not add P3 output blocks. The engine may use Radix P3 source data
  internally, but the existing six output formats remain the public contract.
- Do not remove or rename `danger` tokens.
- Do not promise that a decorative status border alone communicates state.
- Do not change the landing-page repository in this work.
- Do not bump the package version, publish to npm, create a tag, push, open a
  pull request, or deploy.

## Architecture

The generator keeps two distinct color pipelines.

### Brand pipeline

The existing custom Radix-based engine continues to generate:

- accent and gray scales
- backgrounds and raised surfaces
- primary and primary foreground
- ring and input
- analogous and complementary roles
- Radix alpha scales and surfaces

The existing neutral-tint and extreme-seed mode behavior remains intact.

### Semantic pipeline

Semantic roles use complete, unmodified named Radix Colors scales. The
original normalized HEX selects one scale inside each allowed family by the
smallest OKLAB Delta E between the seed and each candidate's sRGB step 9.
Selection uses the emitted sRGB fallback values because this package does not
yet emit P3 overrides.

Allowed candidates are:

| Role | Candidate scales | Achromatic default |
| --- | --- | --- |
| success | jade, green, grass | green |
| destructive | tomato, red, ruby, crimson | red |
| warning | amber, orange | amber |
| info | sky, blue, cyan | blue |

A seed with HSL saturation below 6 percent uses the documented achromatic
default. Equal distances use the listed candidate order. Selection depends on
the original normalized input, not on neutral tint, corrected primary, or a
mode-specific foreground decision.

The selected scale supplies the corresponding light or dark values directly:

| Semantic token role | Radix step |
| --- | --- |
| base | 9 |
| muted | 3 |
| border | 7 |
| foreground candidates | complete selected scale, then generated gray scale, then black or white |
| muted foreground candidates | complete selected scale, then generated gray scale, then black or white |

The foreground chooser requires 4.6. A full-corpus audit prototype applied
this model to all 762 seeds, both tints, and both modes. It found zero base or
muted foreground failures. The weakest observed base pair was destructive at
4.75.

Existing public names remain compatible. The internal role is named
`destructive`, the existing `danger` status tokens remain in every preset, and
shadcn `destructive` tokens remain resolved aliases of the same selected role.
No token is removed.

## Foreground selection

The project keeps the approved palette-first policy.

For a background color and minimum contrast:

1. Measure every candidate in the role's color scale.
2. If the best scale candidate reaches the minimum, use it.
3. Otherwise measure every generated gray candidate.
4. If the best gray reaches the minimum, use it.
5. Otherwise use whichever of black or white has the higher contrast.

This preserves palette cohesion while guaranteeing a deterministic fallback.
It does not select pure black or white merely because a neutral has higher
contrast than an already passing palette candidate.

The minimum for generated text pairs is 4.6. This is a project safety margin
above the WCAG AA 4.5 threshold. It applies to:

- foreground on background
- foreground-subtle on background
- card and popover foregrounds
- primary, secondary, muted, accent, and destructive foregrounds
- analogous and complementary foregrounds
- success, danger, warning, and info base and muted foregrounds
- matching sidebar aliases
- Radix accent and gray contrast roles

Foreground-subtle keeps its existing fixed-round OKLAB correction toward
gray-11, with the target raised to 4.6.

## Surface-aware primary and ring correction

Primary and ring are corrected before any serialization.

The relevant surfaces are the final generated values of background, card, and
popover in the same mode.

For each role:

1. Start with the desired mode seed.
2. Keep it if it reaches the role minimum against all three surfaces.
3. Otherwise consider every accent-scale color that reaches the minimum
   against all three surfaces.
4. Choose the passing candidate with the smallest OKLAB Delta E from the
   desired mode seed.
5. If no accent candidate passes, repeat with the generated gray scale.
6. If no scale candidate passes, use the passing black or white fallback with
   the smallest Delta E from the desired role color.
7. Resolve stable ties by candidate order.

Primary uses the existing non-WCAG 1.5 visibility floor. Ring uses the WCAG
3:1 non-text contrast floor. Primary foreground is recomputed at 4.6 after
primary correction.

The generator does not raise primary to 3:1. A solid primary surface can rely
on its text to identify the control, and forcing 3:1 moved sampled seeds by
several ramp steps and sometimes changed foreground polarity. The 1.5 floor is
therefore a documented visibility preference, not a WCAG claim.

## Semantic borders

Semantic border remains selected scale step 7. It is a subtle UI border and is
not guaranteed to reach 3:1 against the semantic muted surface or page
background.

Generated documentation must state that semantic state cannot rely on the
border or color alone. Meaningful status presentation must use the passing
base and foreground pair, the muted and muted-foreground pair, or equivalent
text and icon content. This preserves the intended Radix border hierarchy
instead of turning every alert outline into a heavy indicator.

## Overrides

`overrides` and `darkOverrides` remain explicit post-generation escape hatches.
They are not part of the general generated-contrast guarantee because callers
can intentionally replace one half of a coupled role.

Every override value must be validated before generation. Supported values are
three-digit HEX, six-digit HEX, and eight-digit HEX with alpha, with or without
a leading `#`. Invalid keys are still allowed because the current API supports
appending custom token names, but invalid values fail with a specific error.

The baked Larsen default remains separately verified after all coordinated
overrides. Its background, foreground, card, popover, sidebar, and ring values
must satisfy the same relevant contrast checks.

## Data flow

The final order is:

1. Validate and normalize input.
2. Choose light and dark mode seeds.
3. Generate brand accent, gray, backgrounds, surfaces, and harmony scales.
4. Select named semantic scales from the original normalized HEX.
5. Resolve semantic tokens for each mode.
6. Correct primary and ring against final background, card, and popover.
7. Recompute every dependent foreground at 4.6.
8. Serialize to the requested format.
9. Apply validated explicit overrides.
10. Assemble the four selector blocks and document defaults.

Format selection cannot change a role choice. HSL and HSL Values retain their
existing precision. Alpha preservation remains unchanged.

## Testing strategy

Implementation follows test-driven development. Each behavior begins with a
focused failing test, followed by the smallest production change and a fresh
green run.

Permanent tests cover:

- semantic family selection for representative and collision seeds
- stable achromatic defaults and deterministic ties
- complete named-scale mapping for both modes
- palette-first 4.6 foreground selection and neutral fallback
- every semantic base and muted foreground pair at 4.6
- primary at 1.5 against background, card, and popover
- ring at 3 against background, card, and popover
- dependent primary foreground recomputation
- foreground-subtle at 4.6
- override validation, including eight-digit alpha HEX
- baked-default post-override contrast
- all three presets, all six formats, both tints, and both modes
- exact token-name and alpha-serialization contracts

The deterministic 762-seed release sweep gains the new role checks and reports
the weakest observed ratio for every pair. Focused serialization tests continue
to cover every format without multiplying the full seed corpus by all six
formats in the normal test suite.

Generated-project smoke verifies that a real scaffold contains the intended
theme and passes its existing build boundary.

## Documentation and provenance

Behavior changes update these authorities in the same implementation:

- `PROJECT.md`
- `docs/reference/palette.md`
- `CHANGELOG.md` under Unreleased
- `palette/NOTICE.md`
- generated theme output and synced package copies
- generated-project README or DESIGN text only where the palette contract is
  described

The historical 0.5.0 and 0.5.1 verification records are not rewritten. New
local verification belongs in a later release record only when an owner chooses
a version and release candidate.

## Verification and delivery boundary

The implementation is complete only after fresh successful runs of:

```bash
npm run gen:theme
npm run sync

cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run verify:palette-sweep
npm run smoke
npm run pack:release
npm run smoke:full -- /absolute/path/reported-by-pack-release.tgz
```

The full smoke uses the exact tarball reported by `pack:release`. The work does
not publish, handle an npm OTP, tag, push, open a pull request, or deploy. Source,
commit, artifact, registry, and live-site status remain separate claims.
