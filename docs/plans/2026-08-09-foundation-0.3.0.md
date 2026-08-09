# Plan: 0.3.0 truth and verification foundation

Status: approved for implementation on 2026-08-09.

## Objective

Make the repository self-describing and mechanically verifiable so a new AI
session can learn the current product contract, its choices, generated output,
known limits, release history, and evidence boundaries without relying on an
old chat or inventing missing facts.

This is a foundation release. It does not add landing-page work, new visual
features, new palette presets, or npm publication. Stian performs `npm publish`.

## Global constraints

- Never Tailwind.
- Use only `-` as a dash in repository content.
- Keep repository and generated content in English.
- Preserve the root `CSS/` and `palette/` directories as the only editable
  masters. Never edit their synced package copies directly.
- Define each mutable fact once. Public summaries link to the canonical
  contract instead of maintaining competing copies.
- Distinguish source state, committed state, packed artifact, npm publication,
  and post-publication verification.
- Treat `create-next-app@latest` and upstream token contracts as observations
  that can drift, not permanent facts.
- Add behavior tests before production changes and observe the intended test
  failure before implementing each behavior.
- Do not publish to npm, push branches or tags, or claim 0.3.0 is published.

## Locked decisions

- Add and document `--default-palette`, `--git`, and `--install`.
- Keep the existing negative forms `--no-git` and `--no-install`.
- Raise the package Node requirement to `>=20.12.0` because the installed
  `@clack/prompts@1.7.0` dependency declares that minimum.
- Prepare one focused 0.3.0 foundation release.
- Create annotated local release tags for 0.1.0 through 0.2.2 at their npm
  `gitHead` commits. Do not create a 0.3.0 tag before npm publication.
- Keep the landing-page project and its status outside the package contract.

## Task 1: Canonical CLI contract and explicit flags

- Create one machine-readable option contract used by argument parsing, help
  output, prompt defaults, and documentation validation.
- Add `--default-palette`, expose the existing positive `--git` and `--install`
  flags, and reject contradictory positive and negative flag pairs.
- Define and test the handling of `--preset`, `--format`, and `--scheme` when no
  custom palette is selected. No option may be silently ignored.
- Keep `--defaults` as the shorthand for all defaults, including no skills.
- Make pinned `--cna-version` runs describe the selected spec truthfully rather
  than always claiming newest stable.
- Raise the Node engine and package version to 0.3.0.
- Add focused behavior tests first, including closed-stdin executions for all
  explicit yes and no paths.

## Task 2: Verification and release gates

- Exercise the extreme-seed dual-mode branch and fail when required contrast
  tokens are missing.
- Verify exact `globals.css`, exact installed-skills documentation, absence of
  Tailwind dependencies and generated Tailwind artifacts, and the conditional
  `NEXTJS.md` behavior.
- Add deterministic contract coverage for all three presets in all six formats
  without implementing the separately planned upstream token expansions.
- Make the packed tarball, not only the source CLI, a release gate. Ensure the
  lifecycle cannot recurse through `npm pack`.
- Keep full install plus `next build` as a separate explicit gate.
- Remove or correct package scripts that point to files unavailable in the
  published tarball.

## Task 3: Documentation authority and history

- Make `AGENTS.md` the mandatory startup protocol. Require a cold session to
  read `PROJECT.md`, the canonical CLI reference, and current verification
  evidence before making behavioral claims.
- Rewrite `PROJECT.md` as the current package contract only. Remove landing
  page and blog state, unsupported attributions, stale defaults, overstated
  tests, and historical narrative presented as current behavior.
- Add a canonical CLI reference describing every flag, prompt, default,
  condition, interaction, CI use, and invalid combination.
- Keep both READMEs as concise verified entry points with executable examples.
- Correct `CHANGELOG.md`, including the 0.1.1 seed change and an unreleased
  0.3.0 foundation entry.
- Preserve the exact approved 0.1.0 plan as immutable history and add a release
  trace for 0.1.0 through 0.2.2 with npm publication evidence.
- Correct the default-theme command to `npm run gen:theme` with no HEX argument.

## Task 4: Whole-foundation verification and release readiness

- Run focused tests, tarball smoke, full smoke with install and production
  build, documentation checks, and clean-worktree checks.
- Scaffold from the local 0.3.0 tarball under closed stdin for default and fully
  explicit custom configurations.
- Compare generated output with the documented contract and record dated local
  evidence without claiming npm publication.
- Create annotated local tags for 0.1.0 through 0.2.2 at the verified npm
  `gitHead` commits and verify their targets. Do not push them.
- Run a broad final review against this plan and resolve all load-bearing
  findings before presenting the branch for integration.

## Completion boundary

Implementation is complete when the branch is internally verified and ready
for Stian to review. Publication, registry verification of 0.3.0, pushing the
branch, pushing tags, and merging are separate user-controlled actions.
