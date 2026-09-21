# Tintful migration - local release evidence

Verification date: 2026-09-22 (Europe/Oslo), Node 24.18.0.
CLI worktree: /tmp/larsen-cli-tintful. Site: /tmp/larsen-site-tintful.
Published state is recorded separately in releases.md.

## Correction of the initial contrast report

The initial claim that three seeds exposed a Tintful 0.1.1 boundary defect was
incorrect. The consumer used Color.js contrastWCAG21(), which derives luminance
from general XYZ-D65 Y. Its coefficients differ slightly from WCAG's normative
sRGB coefficients 0.2126, 0.7152 and 0.0722. Tintful uses the normative formula.
No engine source or npm engine update is needed for this issue.

The consumer now uses Color.js only for CSS parsing/conversion, followed by the
normative WCAG formula with the 0.04045 linearization threshold. No acceptance
threshold was reduced and no export bytes were altered.

| Seed / light pair | Initial incorrect measurement | Normative WCAG ratio |
| --- | ---: | ---: |
| #7B534B / destructive | 4.599920231337044 | 4.60025885591219 |
| #5736FE / warning | 4.5997560607671 | 4.600182615352269 |
| #FE9762 / destructive | 4.599677741566318 | 4.60002238236111 |

These values are identical for none, weak and strong neutrals. Regression tests
now accept all nine cases. The sweep has no expected-rejection allowlist.
The previous artifact with SHA-256
63b4004cf75eadc926b87540970fc18bf391901d9ba5cb6d7d0cc09815703763 is superseded
and must not be published. Its false-negative consumer guard is corrected.
No defect report was sent to the engine release task.

## Engine and native exports

Published dependency: tintful@0.1.1, Node >=22.20.0.
Integrity: sha512-U9/65CEJAUgRZdvnhett4Fi6FwIyT78tkNAqr46YnOVZMmfkF0mM5gpXbu9IIVkP6CkIlXFExXtvFZ0SVkSyTw==.

30 seeds x 51 capability-supported combinations produced 1,530 native exports:
1,275 passed engine quality and 255 were rejected by the engine's own Radix
alpha-equivalent fidelity checks. These are distinct from the retracted consumer
contrast finding. No Radix failure was bypassed or silently reformatted.
All 18 named seeds passed default shadcn output under all three neutrals.

## Earlier consumer verification retained

Actual installed tarball scaffolding and production builds passed. npm, pnpm
and yarn installed dependencies with recognized lockfiles; bun's missing-manager
fallback was verified. The corrected artifact is rerun through these gates.

Browser verified system light/dark and explicit data-theme override in a real
starter. Light body background/foreground: RGB(249,250,251)/RGB(40,44,48).
Dark: RGB(7,7,8)/RGB(218,222,228).

The website verified Worker execution, rapid-input stale-result protection,
seed picker, Strong/Weak comparisons, 48 swatches, desktop and 390px mobile
layout, clipboard command and actual CSS downloads equal to CLI output for
shadcn, Radix and canonical presets. All copied design-system artifacts match
CLI masters. Invalid input, unsupported syntax and failed engine quality hide
exports and commands and display diagnostics in both controls.

Browser text roles across canvas/muted/card for emerald measured >=8.8898:1;
ring across canvas/card/popover >=4.8448:1. Local console errors were limited to
unavailable Vercel Analytics and font preload warnings.

Corrected source, final candidate and rerun evidence follow below.

## Corrected candidate

Merged CLI PR: https://github.com/Stianlars1/larsen-create-next-app/pull/5.
Source gitHead: 497e1baaf23b90413f6a91a4132cd6937b6dd1e1.
74 tests and all 2,286 sweep exports passed; minimum text contrast is
4.60002238236111 with no exceptions. Exact packed smoke and full install/build
smoke passed (npm/pnpm/yarn installs, missing-bun fallback, production build).

Candidate: /var/folders/h1/82t44wr13fj06v4fr9mkkfk40000gn/T/lu-release-candidate-ZfnKJN/larsen-utvikling-create-next-app-0.7.0.tgz.
SHA-256: e389782fda81cf0a94076e4b5724ae3c5c50b422414ffa20836b44efb838bf89.

The user explicitly authorized agent publication and deployment for this release.
The npm publish command reached browser 2FA, but Touch ID timed out. Registry
verification afterward confirmed 0.7.0 was still absent. No npm publication or
website deployment is claimed. Retry the same candidate with fresh authentication.

## Publication completed

A fresh owner Touch ID confirmation completed the authorized publish.
Registry verified at 2026-09-21T22:53:08.621Z: version/latest 0.7.0, gitHead
497e1baaf23b90413f6a91a4132cd6937b6dd1e1, byte-identical candidate download.
See releases.md for the final published record. The earlier timeout is superseded.

## Website production verification

The companion website installed the published npm package, completed npm ci and
passed its publication identity gate. Combined tests after integrating existing
remote main: 39 Node tests and 84 Vitest tests; lint, types and build passed.

Website PR #5 merged as d676d971233b8f22d9c74dec0cc5f3afd7bf2835:
https://github.com/Stianlars1/larsen-create-next-app-site/pull/5.
Vercel production deployment dpl_6pXtZicE121revFaZ38M6UuKszjw is Ready:
https://larsen-create-next-app-site-1xz0rrt32-stians-applications.vercel.app.
The domain https://create-next-app.larsenutvikling.no points to that deployment.
Build duration: 24s. The remote build verified the published CLI identity.

Fresh browser verification on the production domain confirmed versioned 0.7.0
commands, native controls, the named Cyan seed picker and successful #FE9762
export. The live copied stylesheet for #FE9762/shadcn/hsl-values/weak matches the
npm generator's 10,935-character length and FNV-1a-64 bcc678142b4166ab, including
its exact destructive token. No browser errors were observed. The unauthenticated
admin browser navigation resolves to /admin/unlock and displays Admin locked;
that gate has no Umami or GA tracker. The streamed /admin response initially uses
HTTP 200 before redirecting, so the status alone was not treated as access proof.
Vercel's error-level log query for this exact deployment returned zero entries.

A real npx invocation of the registry package generated published-check from
#FE9762 successfully, retaining CSS/audit/manifest files. The CLI's annotated
v0.7.0 tag and GitHub Release point to source 497e1ba, with the verified tarball
attached. Publication and deployment are complete; no engine defect message was
sent because the disputed contrast result was a consumer measurement error.
