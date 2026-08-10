# Published release evidence

Registry evidence for `@larsen-utvikling/create-next-app` versions 0.1.0
through 0.4.0, queried from npm on 2026-08-09, and 0.5.0, queried on
2026-08-10. This is a publication trace, not proof that current local source
matches a published artifact.

## Evidence method

The registry fields were read with:

```bash
npm view @larsen-utvikling/create-next-app@<version> version time dist gitHead --json
npm view @larsen-utvikling/create-next-app versions dist-tags --json
```

The recorded `gitHead` objects exist in this repository. Deltas below were
checked from git history between those exact objects, not inferred from the
current working tree. The npm `dist.shasum` is the SHA-1 digest published by
the registry for that tarball.

## Registry trace

| Version | Published UTC | npm gitHead | npm dist shasum |
| --- | --- | --- | --- |
| 0.1.0 | 2026-08-07T21:29:54.751Z | `295b14da3f57bbb6dc40f5bdd9efdea595b22bb9` | `30177b7ce3184f617bc3c8be502f4c38ab53ccd6` |
| 0.1.1 | 2026-08-07T21:50:04.572Z | `063bf123934cb59f660436d21f88b4a3e15faaa6` | `b47b0346f6aac19c688f8cd86ab96cb2cb1ef0d0` |
| 0.2.0 | 2026-08-08T08:04:27.184Z | `dca3f698eae25e9813b96dbbbbb0f9982138d111` | `3ea96dc948efa0d9a19c9a088dff36bbd0771fee` |
| 0.2.1 | 2026-08-08T17:12:31.749Z | `d056122bfdaa4c9b591b9db02838b688635e7eee` | `396704e92a027305ebfbdf9462a9dde4c06bf66f` |
| 0.2.2 | 2026-08-08T20:39:55.720Z | `9029dd023024b20ce5288f46831bb91013f2b632` | `c08a4792aaa74117eb0eb2bb9b9459b44589f25b` |
| 0.3.0 | 2026-08-09T08:37:31.570Z | `2ee1ccb60e2f0e7a15acaa3b55f6dabe043386a3` | `5e3fc3d23d53461533eadf518f916c5360d421a5` |
| 0.4.0 | 2026-08-09T17:08:02.674Z | `e9c64798538285910e5cf31b45ce53bdc5926de7` | `ad7c2acd1695d5062f3132f07fe10b530454b4c5` |
| 0.5.0 | 2026-08-10T09:51:56.334Z | `33ca295831dcfaa52f4c2e96b73b0f00f95a33fc` | `eda6271799069b14482c6b6ca4f48e8448f2ec86` |

At the 2026-08-10 query, npm listed exactly those eight versions and the
`latest` dist tag pointed to 0.5.0.

## Actual release deltas

### 0.1.0

Initial published baseline at its recorded `gitHead`:

- create-next-app wrapper with TypeScript, App Router, `src/`, no Tailwind,
  selected linter, skipped upstream install, and disabled upstream git
- vanilla CSS masters and synchronized package copies
- default and custom palette generation through the vendored engine
- overlay with agent and design documentation, brand assets, and starter page
- optional wrapper-owned dependency installation and git initialization
- source and tarball smoke paths present at that release boundary

### 0.1.1

Changes between the 0.1.0 and 0.1.1 registry `gitHead` objects:

- corrected extreme seeds by assigning usable seeds per light and dark mode
- added required-token and contrast regression checks for the near-black case
- changed the baked default seed from `#0A0A0A` to brand blue `#4DA0FF`
- pinned default background, foreground, and ring to the intended light and
  dark surface pair and retained separate brand accent tokens

### 0.2.0

Changes between the 0.1.1 and 0.2.0 registry `gitHead` objects:

- added `motion.css`, type tokens, and the reduced-motion token contract
- made the reset color-free and moved document colors into generated themes
- added optional Larsen Skills selection, on-disk verification, and generated
  documentation of only installed skills
- updated starter output and smoke assertions for those additions

### 0.2.1

Changes between the 0.2.0 and 0.2.1 registry `gitHead` objects:

- corrected the page-surface role for radix and css-variables presets
- added prompt guards that fail clearly with closed or piped stdin
- retained explicit fully answered non-interactive execution
- updated the starter page to mention motion tokens

### 0.2.2

Changes between the 0.2.1 and 0.2.2 registry `gitHead` objects:

- added repository, homepage, and issue metadata to the package manifest
- added the root repository README
- added maintainer-oriented project, agent, and changelog documentation
- no generated-project behavior change was recorded for this version

### 0.3.0

Changes between the 0.2.2 and 0.3.0 registry `gitHead` objects:

- centralized the wrapper option contract and generated the CLI reference
  from that source
- added explicit palette, git, and install flags with conflict and input
  validation
- characterized all 18 current palette preset and format combinations and
  pinned the 64/50/50 contracts, format syntax, contrast boundaries, and the
  radix and css-variables equivalence
- strengthened generated-project, overlay, packaging, and full install and
  production-build verification
- introduced the one-artifact release flow with clean-source enforcement and
  exact committed `gitHead` provenance
- separated current package authority, historical plans, local verification,
  published evidence, and version history

### 0.4.0

Changes between the 0.3.0 and 0.4.0 registry `gitHead` objects:

- expanded shadcn from its characterized 64-name state to the approved 81
  color names per mode plus root-level `--radius`
- expanded radix from the characterized generic 50-name state to the
  83-declaration Radix Themes custom-palette override contract
- retained css-variables as an independent 50-name generic contract
- preserved alpha through all six output formats and retained sufficient HSL
  precision for contrast-safe serialization
- enforced primary visibility, focus-ring, text-role, and Radix accent
  contrast behavior against the generated mode surfaces
- added desired-contract, alpha, syntax, mapping, serialized contrast, real
  scaffold, install, production-build, and local HTTP verification

### 0.5.0

Changes between the 0.4.0 and 0.5.0 registry `gitHead` objects:

- removed the public `--scheme` flag, the `scheme` palette property, and the
  `SCHEMES` export, and made the removed property throw instead of being
  ignored; three of its four values had produced byte-identical output
- added `--neutral-tint <subtle|strong>` and `NEUTRAL_TINTS`, mapping the two
  values privately onto the neutral ramps the former analogous and
  monochromatic schemes produced, with no declaration change from the mapping
- added neutral tint as the fourth interactive palette question, asked last
  with `subtle` preselected, driven by a new exported
  `PALETTE_PROMPT_CONTRACT`
- raised `--input` to the closest gray reaching 3:1 against background, card,
  and popover, for WCAG 2.1 SC 1.4.11; `--border` and `--sidebar-border`
  deliberately keep gray-7
- wrapped hue modulo 360 in both color converters, so a seed whose hue rounded
  to 360 no longer fails the engine's range guard and silently produces the
  engine's default blue
- grouped agent skill requests by source repository, with one installer
  invocation and independent on-disk verification per source, and added
  `transitions-dev` as an explicit third-party opt-in that is never vendored
- limited a generated project's skill attribution to the sources it actually
  installed
- moved the contrast checker into `src/` so the published package ships it
- added neutral-tint declaration baselines, tint-independence and hueless-seed
  tests, non-string seed rejection, and a clean parse error for unknown or
  removed flags

## 0.3.0 publication verification

npm listed 0.3.0 with `latest` pointing to it. The published `gitHead` is the
current `main` commit. Annotated tag `v0.3.0` peels to that same object, and
the matching GitHub Release is published as
[v0.3.0 - Verified CLI and release foundation](https://github.com/Stianlars1/larsen-create-next-app/releases/tag/v0.3.0).

The dated pre-publication source, artifact, smoke, build, and reconstructed-tag
evidence remains in [local-0.3.0.md](local-0.3.0.md). That local record and the
registry trace above are separate evidence layers.

## 0.4.0 publication verification

npm listed 0.4.0 with `latest` pointing to it. Its published artifact has 41
files, unpacked size 206945 bytes, registry shasum
`ad7c2acd1695d5062f3132f07fe10b530454b4c5`, and `gitHead`
`e9c64798538285910e5cf31b45ce53bdc5926de7`. Annotated tag `v0.4.0` peels to
that same object, and the matching GitHub Release is published as
[v0.4.0 - Palette contracts and WCAG-safe output](https://github.com/Stianlars1/larsen-create-next-app/releases/tag/v0.4.0).

The implementation, matrix, generated-app, install, production-build, local
HTTP, and pre-publication artifact evidence remains in
[local-0.4.0.md](local-0.4.0.md). That local record and the registry trace
above are separate evidence layers.

## 0.5.0 publication verification

npm listed 0.5.0 with `latest` pointing to it. Its published artifact has 42
files, unpacked size 224851 bytes, registry shasum
`eda6271799069b14482c6b6ca4f48e8448f2ec86`, and `gitHead`
`33ca295831dcfaa52f4c2e96b73b0f00f95a33fc`. Annotated tag `v0.5.0` peels to
that same object, and the matching GitHub Release is published as
[v0.5.0 - Neutral tint, credited skill sources, and an input contrast floor](https://github.com/Stianlars1/larsen-create-next-app/releases/tag/v0.5.0).

The published tarball was downloaded from the registry and compared byte for
byte against the local artifact that passed `npm run pack:release` and
`npm run smoke:full`. Both are SHA-256
`c8665013185a37b801b885c5a7baea590f568e2d9df9d7ea734aac7576c0d102`, so the
artifact on npm is the one that was verified, not a re-pack.

The implementation, contrast-sweep, generated-app, artifact, and landing-page
evidence remains in [local-0.5.0.md](local-0.5.0.md). That local record and
the registry trace above are separate evidence layers.
