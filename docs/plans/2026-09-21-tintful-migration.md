# Tintful consumer migration

Approved scope: migrate CLI, newly generated applications and the separate demo site to published tintful@0.1.1. Keep the engine owned by Tintful. Existing generated projects are unchanged.

## Contract

- Native strict shadcn, radix and canonical CSS contracts; canonical replaces css-variables explicitly.
- Retain hex, rgb (rgb-legacy), hsl (hsl-legacy), hsl-values, oklab and oklch as the CLI subset. Derive supported combinations from capabilities. Radix cannot use hsl-values. Never silently change a requested format or emit failed-quality output.
- Derived neutral hues none, weak and strong. Custom default weak, baked default strong.
- Baked seed #4DA0FF, shadcn, hsl-values. Remove post-generation brand/surface/focus overrides. Separate consumer styling from immutable engine artifacts.
- Node >=22.20.0. Generated projects consume static CSS and audit artifacts without a runtime engine dependency.
- Keep a varied named seed picker. Verify its seeds against the advertised combinations; scope quality claims to the measured engine relationships and final consumer UI.
- Preserve media preference and data-theme overrides. Explicitly omit the shadcn Tailwind bridge.

## Implementation sequence

1. Shared integration: normalize options, consult capabilities, generate and serialize, enforce quality, preserve exact artifact bytes and manifests, expose native preview data and role expressions.
2. CLI/template: change options and prompts, generate before scaffolding, write all artifacts, regenerate baked master, adapt starter roles and docs, remove unused vendored engine.
3. Seed validation: probe diverse candidates and edge cases; retain useful verified seeds and actionable rejection diagnostics.
4. Website: consume shared integration through a bundler-managed Worker, handle transport errors and stale responses, migrate preview/gradient/site theme and export downloads together.
5. Verification: source contracts, every advertised combination, representative/extreme/boundary seeds, artifact hashes, consumer contrast, CLI/site parity, actual packed install/scaffold/build, site tests/lint/types/build/browser.
6. Release: prepare CLI candidate before website; Stian publishes exact verified tarball. Do not deploy commands for an unpublished CLI. Record commits, local evidence, registry and deployment separately.

## Constraints

Preserve unrelated original worktree changes. No Tailwind, engine forks, internal Tintful imports, post-export palette corrections, npm publication or OTP handling. Repository content remains English with ASCII hyphens.

## Review resolutions

Native Tintful replaces legacy algorithm guarantees and removed token pairs.
Retain consumer checks for actual starter surfaces and native semantic pairs,
including 4.6 text and 3 ring/input checks. The former 1.5 primary correction
belongs to historical output, not a new consumer correction layer. Updated
AGENTS.md, PROJECT.md and palette reference state this boundary explicitly.
CLI Radix with omitted global hsl-values format rejects with a supported list;
interactive Radix offers only supported formats and starts at OKLCH.
Release gates include both generated CLI tables, npm/pnpm/yarn/bun coverage,
and full smoke against the exact tarball reported by pack:release.
