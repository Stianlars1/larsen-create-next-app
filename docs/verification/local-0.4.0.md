# Local 0.4.0 palette-contract verification

Local release-readiness evidence collected on 2026-08-09. This record proves
the implementation and artifacts named below. It is not npm publication,
tag, GitHub Release, or post-merge registry evidence.

## Verified implementation

| Field | Value |
| --- | --- |
| Base release | `v0.3.0` at `2ee1ccb60e2f0e7a15acaa3b55f6dabe043386a3` |
| Verified PR implementation | `78ddf43011710c64b21dd93e106bf5ebf7888949` |
| Package version | `0.4.0` |
| PR | `#2` - `codex/palette-desired-contracts` into `main` |
| Candidate filename | `larsen-utvikling-create-next-app-0.4.0.tgz` |
| Candidate embedded `gitHead` | `78ddf43011710c64b21dd93e106bf5ebf7888949` |
| Candidate SHA-256 | `b0797a45efb6c75db95b2bd939342aca936d5207b595135118fb763e5494ebcb` |
| Candidate npm shasum | `3238a7bfb01f43d297821108413dce6ae437cb75` |

This candidate was built before the final release-documentation commit and
PR merge. It is review evidence, not automatically the publishable artifact.
The final tarball must be packed from the actual merged `main` commit and the
same file must pass full smoke before Stian publishes it.

## Desired-contract result

- shadcn emits 81 color names in both modes plus root-level `--radius`, for
  82 light/root declarations and 81 dark declarations.
- Radix emits the 57-name Radix Themes custom-palette override contract plus
  26 Larsen names, for 83 declarations in every mode block.
- CSS Variables remains the independent generic 50-name contract.
- All existing names remain available, including the legacy
  `--destructive-foreground` token.
- Radix alpha scales and surfaces retain alpha in HEX, RGB, HSL, HSL Values,
  OKLAB, and OKLCH.
- HSL and HSL Values retain up to four decimal places so serialization does
  not move a passing foreground pair below its threshold.

The wording is intentionally limited to approved token-name and custom-palette
override contracts. It does not claim full shadcn component compatibility,
full Radix Themes runtime compatibility, or deferred P3 output.

## WCAG correction

- shadcn primary retains the requested mode seed at 1.5:1 or higher against
  background, otherwise using the perceptually closest passing accent step.
- shadcn ring retains the requested mode seed at 3:1 or higher against
  background, otherwise using the closest passing accent step.
- primary foreground is recomputed at 4.5:1 with the existing accent-scale
  first, gray-scale second chooser. Pure black or white remains the final
  fallback.
- Radix accent contrast retains the upstream value at 4.5:1 or higher against
  accent step 9, otherwise using the same scale-first chooser.
- Other verified text-role pairs use the 4.5:1 threshold.

The pre-correction behavior and rollback boundary are in
`docs/plans/2026-08-09-wcag-correction.md`.

## Automated source gates

Run from `create-next-app/`:

```bash
node scripts/generate-cli-reference.mjs --check
npm test
node scripts/smoke.mjs --dev
```

- Both generated CLI references matched `OPTION_CONTRACT`.
- `npm test` passed 83 tests with zero failures, skips, or cancellations.
- Source smoke synchronized the root masters and generated four real apps.
- The tests covered CLI validation, closed stdin, documentation, overlay,
  packaging, palette names and mappings, alpha, contrast, and artifact shape.

## Broad palette matrices

The final implementation was checked with independent matrix scripts:

1. Structure and syntax:
   - 12 seeds x 4 schemes x 3 presets x 6 formats = 864 themes.
   - 3,456 selector blocks.
   - 247,104 declarations.
   - 4,608 representative Radix alpha assertions.
   - zero count, duplicate-name, format, radius, or alpha failures.
2. Raw role contrast:
   - 27 seeds x 4 schemes x 3 presets = 324 themes.
   - 9,072 text-role checks plus 432 primary and ring checks.
   - 108 separate shadcn HSL Values parser themes.
   - zero failures.
3. Serialized role contrast:
   - the 864-theme matrix across all six output formats.
   - 25,344 checks after parsing the emitted values.
   - zero failures.
   - lowest observed result was the deliberate primary visibility floor at
     1.5258:1. Text roles reached 4.5:1 and focus rings reached 3:1.

The serialized matrix found and prevented an integer-HSL regression that
changed one harmony pair from 4.506:1 before serialization to 4.486:1 after
serialization.

## Real artifact scaffolds

Standard and full smoke consumed the exact candidate tarball through relative
`npx` invocation and generated these distinct configurations:

1. Baked default shadcn, HSL Values, monochromatic, ESLint, no skills.
2. Extreme `#0A0A0A` shadcn, HSL Values, monochromatic, no linter, and the
   `motion-craft` skill.
3. `#F59E0B` Radix, OKLCH, complementary, Biome, and no skills.
4. `#F5F5F5` CSS Variables, OKLAB, triadic, no linter, and no skills.

Assertions covered design-system files, exact global CSS, generated docs,
conditional `NEXTJS.md`, brand assets, replacement of upstream starter files,
placeholder removal, absence of Tailwind, exact token counts, Radix alpha,
and separation of preset-only names.

Full smoke installed dependencies in the default app and completed
`next build`. A separate Radix/OKLCH/Biome app installed dependencies, exposed
83 unique names per mode, completed a Next.js 16.3.0 production build, and
returned HTTP 200 for both HTML and compiled CSS containing the palette
tokens.

`npm publish --dry-run` passed for the candidate tarball. No actual npm
publication occurred during these gates.

## Evidence boundary

- The generated-app and contrast evidence is broad but not an exhaustive test
  of every possible HEX input or alpha composition backdrop.
- npm was the package manager used for real install and build gates. Other
  package-manager choices remain CLI-contract tests, not full installation
  evidence in this release review.
- `create-next-app@latest` resolved to Next.js 16.3.0 during the manual gate.
  The dist-tag is mutable and can resolve differently later.
- The final publish artifact and its registry shasum, integrity, publish time,
  and `latest` status require separate post-publish verification.
