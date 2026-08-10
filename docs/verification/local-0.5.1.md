# Local 0.5.1 verification

Pre-publication local implementation evidence collected on 2026-08-10. It
describes source behavior and is not evidence of npm publication, a tag, a
GitHub Release, or deployment. Exact release-candidate identity and artifact
results belong in the later gate section after those results exist.

## Scope and boundary

| Field | Value |
| --- | --- |
| Package version in source | `0.5.1` |
| Implementation base before 0.5.1 | `2913f3a` |
| Release-candidate source | recorded after the candidate commit exists |
| Publication state | unpublished |
| Artifact, tag, release, deployment | no result recorded yet |

This record is intentionally local. `docs/verification/releases.md` remains
the authority for final registry and published-artifact evidence after an
owner-run release.

## Implemented behavior

- `--foreground-subtle` starts at gray-10. If it is below 4.5 against the mode
  background, it takes the closest displayable sRGB point along the OKLAB path
  toward gray-11 that clears 4.5. The gray ramp is unchanged, and the
  mechanical checker adds foreground-subtle against background at 4.5.
- Supplied `darkHex` values that are blank, malformed, or non-strings fail
  explicitly. `null` and `undefined` remain absent values; valid three- and
  six-digit HEX values continue to work.
- Generated README and `AGENTS.md` use the same source-aware skills section.
  No-skills and Larsen-only projects do not carry a third-party pointer.
- Neutral-tint accent invariance applies to chromatic seeds. The exact hueless
  exceptions are `#000000`, `#010101`, `#FEFEFE`, and `#FFFFFF`.

An independent declaration review found no output change other than the
foreground-subtle correction across 396 cases and across all 360 hue inputs x
2 neutral tints x 6 formats. The six-format foreground-subtle minimum observed
was 4.5000268.

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

## Targeted local checks

- The targeted foreground-subtle, darkHex, neutral-tint, generated README,
  and six-format palette tests were green in the current working tree.
- The deterministic sweep result above was green with zero failures.
- No final `npm test` count is recorded here. No release tarball, tarball
  smoke, full install/build smoke, npm publish, tag, GitHub Release, or
  deployment result has been recorded.

## Later release-candidate evidence - fill only after the gates run

Leave this section incomplete until the versioned source is committed and the
following results exist for that exact candidate:

- `node scripts/generate-cli-reference.mjs --check`
- `npm test`
- `npm run verify:palette-sweep`
- `npm run pack:release`, including the reported tarball path and embedded
  `gitHead`
- `npm run smoke:full -- /path/to/the-reported-tarball.tgz`

After an owner-run publish, record registry metadata, tag, and release status
only in `docs/verification/releases.md`.
