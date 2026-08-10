# Third-party agent skills audit

Date: 2026-08-09

Status: Decision recorded 2026-08-10. Functional duplicates and overlapping
skills are excluded. `transitions-dev` is approved for direct, explicit opt-in
installation from Jakub Antalik's repository under the published custom terms.

## Scope

This audit compares the 13 requested upstream skills with the nine skills in
the local Larsen Skills collection. It establishes source ownership, records
the applicable license, identifies functional overlap, and recommends what to
consider for a later explicit opt-in.

The governing decision is unchanged: any approved third-party skill must be
installed from its author's repository. It must never be copied into
`Stianlars1/larsen-skills`.

`duplicate` below means that two skills serve the same primary user job and
produce substantially the same kind of result. It is a functional comparison,
not an allegation that their text was copied.

## Evidence basis

The comparison was performed against these exact source states:

- Local Larsen Skills at `/Users/stian/Documents/larsen-skills`, clean on
  `main` at commit
  [`a4a9dc4412120ff7f841f6411670ae76823e2159`](https://github.com/Stianlars1/larsen-skills/tree/a4a9dc4412120ff7f841f6411670ae76823e2159).
  The local skill and shared-reference contents matched that commit. Its
  [`SOURCES.md`](https://github.com/Stianlars1/larsen-skills/blob/a4a9dc4412120ff7f841f6411670ae76823e2159/SOURCES.md)
  records how public work by Emil Kowalski and Jakub Krehel informed the
  original Larsen synthesis.
- Emil Kowalski's
  [`emilkowalski/skills`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills)
  at commit `9075d1724a831411ab5cf138dd9b5cd406ffc2e2`. The repository's
  [MIT License](https://github.com/emilkowalski/skills/blob/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/LICENSE)
  applies to the requested skills.
- Jakub Krehel's
  [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills)
  at commit `d01493b0a7b976a74bfcedc80c783d60c7995910`. The repository's
  [MIT License](https://github.com/jakubkrehel/skills/blob/d01493b0a7b976a74bfcedc80c783d60c7995910/LICENSE)
  applies to the requested skills.
- Jakub Antalik's
  [`transitions-dev`](https://github.com/Jakubantalik/transitions.dev/tree/06f81950a67c1a89bd418be91f8a26ebca6472a9/skills/transitions-dev)
  at commit `06f81950a67c1a89bd418be91f8a26ebca6472a9`.
  [`terms.html`](https://github.com/Jakubantalik/transitions.dev/blob/06f81950a67c1a89bd418be91f8a26ebca6472a9/terms.html)
  and the current [Transitions.dev terms](https://transitions.dev/terms.html)
  are the license evidence for the transition content.

The comparison used the nine local source skills and their shared original
references. Generated standalone packages were not treated as separate
sources.

## Result

Five requested skills are functional duplicates, seven overlap materially, and
one is distinct. `transitions-dev` is the only clear addition of a new primary
capability. Its custom license and upstream consistency issue were explicitly
accepted for the constrained direct-install integration recorded below.

| Author and upstream skill | License | Closest Larsen skill | Overlap | Recommendation |
| --- | --- | --- | --- | --- |
| Emil Kowalski - [`animation-vocabulary`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills/animation-vocabulary) | MIT | `motion-vocabulary` | duplicate | Do not install both. Keep the Larsen skill and retain clear source credit to Emil. |
| Emil Kowalski - [`find-animation-opportunities`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills/find-animation-opportunities) | MIT | `motion-craft` | duplicate | Leave it out. The `motion-craft` opportunities mode already provides the same gate, findings, and rejected-candidate result. |
| Emil Kowalski - [`review-animations`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills/review-animations) | MIT | `motion-craft` | duplicate | Leave it out. The strongest collision is with `motion-craft` review mode, with secondary overlap against `interface-review`. |
| Emil Kowalski - [`improve-animations`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills/improve-animations) | MIT | `motion-craft` | duplicate | Leave it out. The `motion-craft` improve mode already produces prioritized, self-contained correction plans. |
| Emil Kowalski - [`emil-design-eng`](https://github.com/emilkowalski/skills/tree/9075d1724a831411ab5cf138dd9b5cd406ffc2e2/skills/emil-design-eng) | MIT | `motion-craft` | overlapping | Exclude by default. Consider an explicit opt-in only if Emil's own voice and combined philosophy are independently valuable to the product. |
| Jakub Krehel - [`better-ui`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-ui) | MIT | `interface-craft` | overlapping | Leave it out. Surfaces, icons, optical alignment, and motion rules are already covered across Larsen's interface and motion references. |
| Jakub Krehel - [`better-colors`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-colors) | MIT | `interface-craft` | overlapping | Leave it out. Larsen covers the same color, gamut, palette, and contrast domain, while upstream also carries Tailwind-specific guidance outside this generator's contract. |
| Jakub Krehel - [`better-layout`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-layout) | MIT | `interface-craft` | overlapping | Leave it out. Larsen's `layout-structure` reference covers the same grouping, alignment, reading-order, and adaptive-layout rules. |
| Jakub Krehel - [`better-writing`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-writing) | MIT | `interface-craft` | overlapping | Leave it out. Larsen's `interface-copy` reference covers the same workflow and main rules. |
| Jakub Krehel - [`better-interface`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-interface) | MIT | `interface-review` | duplicate | Leave it out. Both coordinate a holistic, evidence-based, read-only interface review into one prioritized verdict. |
| Jakub Krehel - [`better-typography`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-typography) | MIT | `interface-craft` | overlapping | Leave it out. Larsen covers type scales, wrapping, font formats, OpenType, language behavior, and verification. |
| Jakub Krehel - [`better-accessibility`](https://github.com/jakubkrehel/skills/tree/d01493b0a7b976a74bfcedc80c783d60c7995910/skills/better-accessibility) | MIT | `interface-craft` | overlapping | Leave it out. Larsen's accessibility contract covers the same implementation and review domain. |
| Jakub Antalik - [`transitions-dev`](https://github.com/Jakubantalik/transitions.dev/tree/06f81950a67c1a89bd418be91f8a26ebca6472a9/skills/transitions-dev) | Custom Transitions.dev terms | `motion-craft` | distinct | Approved for explicit opt-in, installed directly from the author's repository. Do not vendor or repackage it. |

## License gate

### Emil Kowalski

All five requested Emil Kowalski skills have a clear MIT license at the audited
commit. License clarity does not remove the product-level duplication described
above.

### Jakub Krehel

All seven requested Jakub Krehel skills have a clear MIT license at the audited
commit. License clarity does not remove their functional overlap with Larsen's
interface skills and shared references.

### Jakub Antalik

`transitions-dev` is not covered by the MIT terms that apply to the repository's
CLI and Refine tooling. The custom terms state that free and Pro transitions may
be used, modified, and shipped as part of unlimited personal and commercial
projects. They prohibit repackaging, reselling, or publishing the collection or
a substantial part of it as a competing transitions library, template pack, or
component kit.

The upstream repository itself documents installation with
`npx skills add Jakubantalik/transitions.dev`. On 2026-08-10, the default branch
still resolved to the audited commit and the exact non-interactive command
`npx --yes skills add Jakubantalik/transitions.dev --skill transitions-dev --yes`
was verified in an empty temporary directory. It created
`.agents/skills/transitions-dev/SKILL.md`.

Stian accepted these custom terms for direct, explicit opt-in installation on
2026-08-10. The integration must use the upstream route and must not vendor or
repackage the skill. This audit records the published terms and owner decision;
it is not legal advice.

## Upstream risks and implementation constraints

### Exact-name collision in Jakub Krehel's repository

The audited Jakub Krehel repository contains an additional, unrequested skill
named `interface-review`. That name exactly collides with Larsen's
`interface-review`.

Any later implementation must pass explicit approved skill names for that
source. It must never install the repository with a wildcard or treat every
future skill in the repository as approved. On-disk verification must also be
source-aware so an existing Larsen file cannot be mistaken for a newly
installed third-party result.

### Inconsistent transition count

The audited `transitions-dev` directory contains 27 numbered transition
reference files. Its quick-reference table also has 27 rows, but several parts
of `SKILL.md` and the repository README still say there are 21 or 18
transitions. This does not change the overlap classification, but it is a
current upstream quality and documentation risk.

The approved implementation avoids publishing a hard-coded transition count.
The upstream source, terms, and exact installer command were rechecked on
2026-08-10 before implementation verification.

## Decision

Stian recorded the decision on 2026-08-10:

1. Exclude the five functional duplicates.
2. Exclude the seven materially overlapping skills.
3. Include `transitions-dev` only as an explicit opt-in installed directly from
   Jakub Antalik's repository.

Existing `--skills recommended`, `--skills all`, and `--defaults` behavior must
remain unchanged. Users may still select any approved name explicitly, and a
later source failure must not prevent another source from succeeding.

## Verification boundary

This document verifies source location, observed content, functional overlap,
and published license evidence at the pinned commits. The 2026-08-10 follow-up
also verifies the then-current default branch and exact direct installer
command. It does not verify a future upstream default branch, a future license,
npm publication, deployment, or live site behavior.

Phase 1 itself changed no CLI code, generated-project content, package contract,
changelog, Larsen Skills file, or landing-page file. The 2026-08-10 decision
and implementation are recorded separately from that original audit boundary.
