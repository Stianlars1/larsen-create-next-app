# Local 0.5.1 verification

Pre-publication local implementation and release-candidate evidence collected
on 2026-08-10. It describes source and artifact behavior and is not evidence
of npm publication, a tag, a GitHub Release, or deployment.

## Scope and boundary

| Field | Value |
| --- | --- |
| Package version in source | `0.5.1` |
| Implementation base before 0.5.1 | `2913f3a` |
| Release-candidate source | `838f6ce21813866d7d4d7c5789fe46f7d6125e06` |
| Verified tarball | `create-next-app/larsen-utvikling-create-next-app-0.5.1.tgz` |
| Tarball SHA-256 | `596561f33c62b644e9485d316a9b46d061a3b08cce705d2b64a74a5637d4e7f1` |
| Tarball size and file count | 60,762 bytes, 42 files |
| 0.5.1 npm publication state | unpublished |
| 0.5.1 tag, GitHub Release, deployment | none |

This record is intentionally local. `docs/verification/releases.md` remains
the authority for final registry and published-artifact evidence after an
owner-run release.

## Implemented behavior

- `--foreground-subtle` starts at gray-10. If it is below 4.5 against the mode
  background, a fixed 24-round binary search follows the OKLAB path toward
  gray-11 and emits the passing 8-bit sRGB candidate at the isolated boundary.
  The gray ramp is unchanged, and the mechanical checker adds
  foreground-subtle against background at 4.5.
- Supplied `darkHex` values that are blank, malformed, or non-strings fail
  explicitly. `null` and `undefined` remain absent values; valid three- and
  six-digit HEX values continue to work.
- Generated README and `AGENTS.md` use the same source-aware skills section.
  No-skills and Larsen-only projects do not carry a third-party pointer.
- Neutral-tint accent invariance applies to chromatic seeds. The exact hueless
  exceptions are `#000000`, `#010101`, `#FEFEFE`, and `#FFFFFF`.

The permanent declaration tests lock every non-foreground-subtle declaration
to the 0.5.0 baseline for `#4DA0FF` across both tints, all three presets, and
all six formats. Separate complete 0.5.1 hashes lock the corrected shadcn
output under both tints and all six formats.

## Deterministic palette sweep

`npm run verify:palette-sweep` uses 762 unique seeds under two neutral tints:
1,524 generated themes. The locked seed corpus SHA-256 is
`25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9`. The
recorded result is zero failures.

| Pair | Required | Worst ratio | Seed, tint, mode |
| --- | ---: | ---: | --- |
| foreground vs background | 4.5 | 14.241988 | `#CBE542`, strong, light |
| foreground-subtle vs background | 4.5 | 4.500054 | `#823E68`, subtle, light |
| card-foreground vs card | 4.5 | 14.241988 | `#CBE542`, strong, light |
| popover-foreground vs popover | 4.5 | 13.564288 | `#6C6875`, subtle, dark |
| ring vs background | 3 | 3.000719 | `#42A98C`, subtle, light |
| input vs background | 3 | 3.648584 | `#AF2D0F`, strong, dark |
| input vs card | 3 | 3.379647 | `#F4B378`, strong, dark |
| input vs popover | 3 | 3.042743 | `#AF2D0F`, strong, dark |
| primary-foreground vs primary | 4.5 | 4.504312 | `#8A53BF`, subtle, light |
| primary vs background | 1.5 | 1.500667 | `#FDCEA5`, subtle, light |

## Release-candidate gates

The following results all apply to source commit
`838f6ce21813866d7d4d7c5789fe46f7d6125e06` and the exact tarball identified
above:

- `node scripts/generate-cli-reference.mjs --check` passed.
- `npm test` passed 177 tests with zero failures.
- `npm run verify:palette-sweep` passed the 1,524-theme sweep recorded above.
- `npm run smoke` passed against the development scaffold.
- `npm run pack:release` passed and reported the verified tarball above. Its
  embedded `gitHead` is the release-candidate source commit.
- `npm run smoke:full -- '/Users/stian/Larsen Utvikling/prosjekter/_TEMPLATES/create-next-app/larsen-utvikling-create-next-app-0.5.1.tgz'`
  passed the artifact checks, generated-project checks, install, and production
  build.
- `npm publish --dry-run --ignore-scripts=false` passed for that tarball and
  reported version `0.5.1`, 42 files, and package size 60.8 kB.
- SHA-256 was checked before and after the npm dry-run and remained
  `596561f33c62b644e9485d316a9b46d061a3b08cce705d2b64a74a5637d4e7f1`.

The dry-run did not publish. No npm publish, push, tag, GitHub Release, or
deployment was performed. After an owner-run publish, registry metadata, tag,
and release status belong only in `docs/verification/releases.md`.
