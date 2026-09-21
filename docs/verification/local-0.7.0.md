# Tintful migration - local release evidence

Worktree: `/tmp/larsen-cli-tintful`. Companion: `/tmp/larsen-site-tintful`.
Verification date: 2026-09-22 (Europe/Oslo). Runtime: Node 24.18.0.
This is local evidence, not publication or deployment proof.

## Engine and contract

Registry confirms tintful 0.1.1, Node >=22.20.0, integrity
`sha512-U9/65CEJAUgRZdvnhett4Fi6FwIyT78tkNAqr46YnOVZMmfkF0mM5gpXbu9IIVkP6CkIlXFExXtvFZ0SVkSyTw==`.
The CLI registry still lists 0.6.0 as latest. 0.7.0 is an unpublished candidate.

Native strict shadcn/radix/canonical output replaces the old engine and token
contracts. Audit files retain exact serialized bytes. Browser download parity
was verified for #005F78, radix, rgb, weak against the CLI integration.

## Export probe

30 seeds x 51 capability-supported combinations = 1,530 exports.
1275 passed; 255 returned failed export quality and must be rejected.

All failures were Radix alpha-equivalent fidelity diagnostics, not wrapper
format fallbacks. The engine was not modified. In particular #4DA0FF with
neutral none also fails Radix OKLCH, and some seeds reject all Radix formats.
The UI and CLI expose these failures, so valid syntax is not marketed as
universal seed support. All 18 named shortcuts passed shadcn generation/export
and consumer contrast under none, weak and strong in the website test suite.

| Seed | Passing combinations | Rejected combinations |
| --- | ---: | ---: |
| `#4DA0FF` | 47 | 4 |
| `#A1A1A1` | 45 | 6 |
| `#973C00` | 36 | 15 |
| `#193CB8` | 47 | 4 |
| `#005F78` | 47 | 4 |
| `#006045` | 47 | 4 |
| `#8A0194` | 47 | 4 |
| `#016630` | 47 | 4 |
| `#372AAC` | 36 | 15 |
| `#7CCF00` | 47 | 4 |
| `#9F2D00` | 36 | 15 |
| `#A3004C` | 36 | 15 |
| `#6E11B0` | 36 | 15 |
| `#9F0712` | 36 | 15 |
| `#A50036` | 36 | 15 |
| `#00598A` | 47 | 4 |
| `#005F5A` | 47 | 4 |
| `#5D0EC0` | 36 | 15 |
| `#EFB100` | 47 | 4 |
| `#000000` | 45 | 6 |
| `#FFFFFF` | 45 | 6 |
| `#010101` | 45 | 6 |
| `#FEFEFE` | 45 | 6 |
| `#808080` | 45 | 6 |
| `#FF0000` | 36 | 15 |
| `#00FF00` | 47 | 4 |
| `#0000FF` | 36 | 15 |
| `#777777` | 45 | 6 |
| `#611431` | 36 | 15 |
| `#9F46B1` | 47 | 4 |

## Checks

- Native export and integration tests: passing bytes, hashes, sidecar references,
  capabilities, removed options, quality failure rejection and edge seeds.
- CLI suite: 72 tests passed before final artifact assertion additions.
- Website suite: 32 tests passed, including Worker correlation, transport failure
  and restart, native choice parity, named seed contrast and export byte parity.
- Website lint, TypeScript and production build passed during implementation.
- Preliminary real tarball smoke exercised default/custom/Radix/canonical apps.
  It exposed an obsolete assumption that every named Radix alpha token must be
  translucent; corrected to preserve native opaque tokens and verify exact bytes.
- The old Color.js 0.5 parser misread modern `none` hue and decimal RGB syntax.
  Consumer verification now uses 0.7.1. The engine and exported CSS were unchanged.

Final sweep, release candidate path/hash, full smoke and final browser evidence
are recorded below when complete. Stian must publish the exact verified tarball;
the website must not deploy until that exact CLI version is available on npm.

## Final local gates

- CLI source: `4a47ba0da029fa04bbc4484b2219c57f966320d0`.
- `npm run gen:theme` and `npm run sync` reproduce committed masters unchanged.
- Generated CLI reference check passes.
- `npm test`: 73/73 passing.
- `npm run verify:palette-sweep`: 762 seeds, 2,286 attempts, 2,277 passing
  exports, exactly nine locked consumer-margin rejections, zero unexpected
  failures. Weakest accepted text ratio: 4.6000037838846275.
- The nine rejections are #5736FE, #7B534B and #FE9762 under all three neutral
  settings. The consumer checks final serialized CSS and refuses the original
  output rather than changing colors or lowering the 4.6 project target.
- `npm run pack:release`: verified supplied-artifact scaffold smoke passed.
- `npm run smoke -- --tarball <candidate>` passed again against the same file.
- `npm run smoke:full -- <candidate>` passed: actual npm, pnpm and yarn installs
  with recognized lockfiles; bun unavailable and explicit missing-manager
  behavior verified; generated application's production build passed.

Candidate (retain for owner publication):
`/var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-84mmZk/larsen-utvikling-create-next-app-0.7.0.tgz`

SHA-256: `63b4004cf75eadc926b87540970fc18bf391901d9ba5cb6d7d0cc09815703763`.
SHA-512 integrity: `sha512-nhRy/EM3qgWN3lUsXHQ0XnZHipitwsXPFKHjd8bfFfxzw/pKObh10FKuv0ZvqNPPL/ZJ6AjxWk6hlCCnTkrs4Q==`.
The tarball embeds the source commit above as gitHead. An evidence-only commit
following it does not change the candidate's source identity.

## Rendered verification

A separately installed copy of the candidate generated
`/tmp/tintful-starter-verification/demo`, installed dependencies and built for
production. Browser on port 4318 verified system light/dark and data-theme
light overriding a dark system preference. Light body background/foreground:
RGB(249,250,251)/RGB(40,44,48). Dark: RGB(7,7,8)/RGB(218,222,228).

The website installed this exact candidate and passed 33 tests, lint, types and
production build. Browser on port 4319 verified:

- One bundler-managed Worker; rapid seed edits keep the latest result.
- Seed picker selection and Strong versus Weak comparison with 48 swatches.
- Native canonical/OKLAB preview and gradients, plus shadcn and Radix previews.
- Actual downloaded CSS equals the CLI byte-for-byte for cyan/radix/RGB/weak,
  emerald/shadcn/HSL-channels/weak, and cyan/canonical/OKLAB/strong.
- Actual clipboard command matches the accepted seed and candidate version.
- Unsupported Radix HSL channels, failed Radix HEX fidelity, the #7B534B
  consumer-margin rejection, and invalid HEX suppress commands/downloads and
  show actionable state. Both demo and builder surface the rejection.
- Actual browser text roles on canvas/muted/card for emerald measured at least
  8.8898:1; ring across canvas/card/popover at least 4.8448:1.
- Desktop and 390px mobile visual inspection; mobile scroll width is 390px.
- All website design-system copies equal CLI masters byte-for-byte.

Local browser console has expected unavailable Vercel Analytics endpoint errors
and font preload warnings. No Worker or application exceptions were observed.
Screenshots: `/tmp/tintful-demo-desktop-final.png`,
`/tmp/tintful-demo-mobile-final.png`, `/tmp/tintful-starter-light.png`,
`/tmp/tintful-starter-dark.png`.

## Release boundary

No npm publication, release tag, PR, merge, website deployment or live production
verification was performed. Registry verification still reports CLI 0.6.0.
The website pins candidate 0.7.0 and its exact integrity. Its lockfile uses the
intended npm artifact URL for installation after publication; local checks used
the exact candidate tarball. Hosted builds additionally verify npm version,
integrity and gitHead. `node scripts/verify-cli-release.mjs --require-published`
currently fails with the explicit unpublished-CLI message, as required.

Stian publishes the exact candidate first. Then verify registry identity, run
website npm ci and the publication gate, and deploy/verify the website. Do not
repack or deploy candidate commands before publication.
