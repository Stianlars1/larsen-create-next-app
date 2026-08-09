# Local 0.3.0 foundation verification

Local release-readiness evidence collected on 2026-08-09. This record proves
only the source commit and release artifact named below. It is not npm
publication evidence.

## Verified input

| Field | Value |
| --- | --- |
| Source commit used to pack | `b26224c7fc54c6fb564e4078d8a4cc17d76afa96` |
| Embedded manifest `gitHead` | `b26224c7fc54c6fb564e4078d8a4cc17d76afa96` |
| Package version | `0.3.0` |
| Artifact filename | `larsen-utvikling-create-next-app-0.3.0.tgz` |
| Artifact size | 51,505 bytes |
| Artifact SHA-256 | `210df836d7fb91a470ff87eb8289b642df3d52aa6c3ce4bea79b932cc23a5e26` |
| Verification runtime | Node.js `v24.18.0`, npm `11.16.0` |

The artifact was created exactly once through `npm run pack:release`. The
absolute path printed by that command was passed unchanged to the full smoke
gate. The tarball was not repacked between gates.

## Gates and results

Run from `create-next-app/`:

```bash
node scripts/generate-cli-reference.mjs --check
npm test
npm run pack:release
npm run smoke:full -- /absolute/path/reported-by-pack-release.tgz
```

- Generated CLI references were current.
- `npm test` passed 70 tests with 0 failures, skips, or cancellations.
- `pack:release` synchronized the root CSS and palette masters into an
  isolated staging copy, verified release-relevant source was clean, embedded
  the exact full source HEAD, produced the consumer-clean artifact, and passed
  the standard tarball smoke. Temporary Git-fixture tests separately proved
  both tracked and untracked release-source changes are rejected.
- `smoke:full` consumed the same artifact, passed the same scaffold contract,
  installed dependencies, and completed `next build` successfully.
- The source publication guard was exercised through `npm publish --dry-run`.
  The source directory failed through its `prepublishOnly` wiring. The exact
  verified tarball completed publication dry-run with repository-only scripts
  absent, the same embedded `gitHead`, and the same SHA-256 afterward.

Both real scaffold paths ran with ignored stdin, so no prompt could be
answered interactively:

1. Default scaffold: `--defaults --pm npm --no-git --no-install --no-skills`.
2. Fully explicit custom scaffold: `--hex 0A0A0A --preset shadcn --format
   hsl-values --scheme monochromatic --linter none --pm npm --no-git
   --no-install --skills motion-craft`.

The assertions covered the documented design-system files, exact global CSS,
default and custom palette structure, four theme selector blocks, exact
installed-skills documentation, conditional `NEXTJS.md`, overlay replacements,
brand assets, placeholder removal, and the absence of Tailwind dependencies,
directives, and configuration artifacts.

The mechanical contrast assertion was deliberately bounded to the two
`shadcn` plus `hsl-values` smoke themes. In both generated modes it checked
`--foreground` vs `--background` at 4.5, `--ring` vs `--background` at 3,
`--primary-foreground` vs `--primary` at 4.5, and `--primary` vs
`--background` at the non-WCAG 1.5 visibility floor. This does not verify
contrast for other preset-format matrix entries.

## Reconstructed historical tags

Registry fields were queried live before creating any tag. Each annotated
local tag records that it was reconstructed from npm registry evidence.

| Local tag | Verified npm `gitHead` target |
| --- | --- |
| `v0.1.0` | `295b14da3f57bbb6dc40f5bdd9efdea595b22bb9` |
| `v0.1.1` | `063bf123934cb59f660436d21f88b4a3e15faaa6` |
| `v0.2.0` | `dca3f698eae25e9813b96dbbbbb0f9982138d111` |
| `v0.2.1` | `d056122bfdaa4c9b591b9db02838b688635e7eee` |
| `v0.2.2` | `9029dd023024b20ce5288f46831bb91013f2b632` |

All five references were verified as annotated tag objects resolving to the
listed commits. These tags are local and have not been pushed.

## Evidence boundary

At the end of this verification:

- 0.3.0 is not published to npm and has not been registry-verified.
- No 0.3.0 tag exists.
- The branch and reconstructed historical tags have not been pushed.
- The branch has not been merged.
- The tarball is a local candidate, not a published release.
