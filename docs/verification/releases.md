# Published release evidence

Registry evidence for `@larsen-utvikling/create-next-app` versions 0.1.0
through 0.2.2, queried from npm on 2026-08-09. This is a publication trace,
not proof that current local source matches a published artifact.

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

At query time, npm listed exactly those five versions and the `latest` dist
tag pointed to 0.2.2.

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

## 0.3.0 boundary

The current branch manifest says 0.3.0, but npm did not list 0.3.0 on
2026-08-09. Therefore 0.3.0 is local and unpublished. A local commit, test
run, release tarball, or tag cannot change that statement. Only an owner-run
publish followed by exact registry verification can add a 0.3.0 row here.

The repository must not create or claim a 0.3.0 release tag before that
publication boundary. Existing-version tag work is a separate verification
task and is not evidence that 0.3.0 has shipped.

The dated local 0.3.0 source, artifact, smoke, build, and reconstructed-tag
evidence is recorded separately in
[local-0.3.0.md](local-0.3.0.md). That local record is not registry evidence.
