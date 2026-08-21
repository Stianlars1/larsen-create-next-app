# Local 0.6.0 verification

Pre-publication local source and release-artifact evidence collected on
2026-08-21. This document is not evidence of npm publication, a tag, a GitHub
Release, a deployment, or live-site behavior.

## Scope and identity

| Field | Value |
| --- | --- |
| Package version | `0.6.0` |
| Verified release source | `c0c5222c737cdfb16453825bc22a6b8a7036dddc` |
| Source branch at packing | `main` and `codex/palette-quality-audit` at the same commit |
| Verified tarball | `/var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-qljeae/larsen-utvikling-create-next-app-0.6.0.tgz` |
| Tarball SHA-256 | `d88ee7d813acbb792b0234a577432fc94fc2401f45a6fccb7a6f7561856bbebb` |
| npm shasum | `80c82fb9350bec0f14ed63e3e4b2ad9e5dffe26b` |
| Package size | 63,365 bytes |
| npm dry-run package size | 63.4 kB |
| npm dry-run unpacked size | 237.3 kB |
| File count | 44 |
| Embedded `gitHead` | `c0c5222c737cdfb16453825bc22a6b8a7036dddc` |
| npm publication state | Unpublished at this record |

The exact tarball above is the only 0.6.0 artifact authorized for the owner-run
publish step. Repacking would create a different artifact and requires the
complete gate sequence again.

## Implemented release behavior

- Semantic success, danger, warning, and info values select complete named
  Radix scales from stable role families based on the normalized seed.
- Generated text pairs target 4.6 while keeping palette-first foregrounds.
- Primary reaches the project 1.5 visibility floor and ring reaches 3 against
  background, card, and popover.
- Crossover correction preserves harmony scales and coherent Radix solid,
  alpha, indicator, track, and contrast aliases.
- Primary foreground remains neutral-tint stable, with explicit chromatic and
  achromatic fallback contracts.
- Override values accept valid 3, 6, and 8 digit HEX and reject malformed
  values before palette rendering.
- Generated documentation describes the current 4.6, surface, fallback, and
  semantic-border contracts.

## Verification gates

The following commands were run from the release source:

```bash
cd create-next-app
node scripts/generate-cli-reference.mjs --check
npm test
npm run verify:palette-sweep
npm run smoke
npm run pack:release
npm run smoke:full -- /var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-qljeae/larsen-utvikling-create-next-app-0.6.0.tgz
npm publish --dry-run --ignore-scripts=false /var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-qljeae/larsen-utvikling-create-next-app-0.6.0.tgz
```

Results:

- CLI references were current.
- 197 source tests passed with zero failures, skips, or todos.
- The locked 762-seed by 2-tint sweep generated 1,524 themes and passed all
  28 role pairs in both modes. It retained exactly four permitted cross-tint
  primary and ring alias differences.
- Standard smoke passed default, custom shadcn, Radix, and CSS Variables real
  scaffold assertions.
- `pack:release` created the exact tarball recorded above and passed its
  supplied-tarball smoke.
- Full smoke passed npm, pnpm, and yarn installs, the explicit bun
  missing-manager contract, and `next build` in the npm-generated app.
- npm publish dry-run reported `@larsen-utvikling/create-next-app@0.6.0`, 44
  files, package size 63.4 kB, unpacked size 237.3 kB, and the recorded npm
  shasum.

Representative weakest sweep measurements were:

| Pair | Required | Worst observed |
| --- | ---: | ---: |
| foreground-subtle / background | 4.6 | 4.600155 |
| primary-foreground / primary | 4.6 | 4.603508 |
| analogous-foreground / analogous | 4.6 | 4.601247 |
| complementary-foreground / complementary | 4.6 | 4.600102 |
| ring / background, card, popover | 3 | 3.000812 |
| primary / background, card, popover | 1.5 | 1.500633 |

## Owner publish gate

Stian publishes from the exact artifact and handles npm 2FA:

```bash
cd '/Users/stian/Larsen Utvikling/prosjekter/_TEMPLATES-palette-quality/create-next-app'
npm publish --access public '/var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-qljeae/larsen-utvikling-create-next-app-0.6.0.tgz'
```

After that command succeeds, registry metadata must be verified before any tag,
GitHub Release, landing-page dependency update, or deployment claim is made.

## Evidence boundary

No actual npm publication or OTP handling was performed. No 0.6.0 tag or
GitHub Release was created. The landing page remains pinned and locked to
0.5.1, and no landing-page build or deployment was performed for 0.6.0.
