# Next session: colour harmony, and why --scheme barely does anything

This file is the prompt for a **new chat**. It changes generated output for
every future project, so it is a deliberate decision rather than a bug fix, and
it does not belong in the session that found it.

Found 2026-08-09 while auditing the landing page. Stian's call: do not fix it
inline, audit it properly first and come back with a plan.

---

## Copy everything below into the new chat

`@larsen-utvikling/create-next-app` accepts `--scheme analogous | monochromatic
| complementary | triadic`. I have measured what it actually does, and three of
those four are identical. I want you to work out whether that is worth fixing,
and if so how, before writing any code.

### What I measured

Running the published generator across four seeds (`#4DA0FF`, `#E11D48`,
`#22C55E`, `#7C3AED`) and all three presets, comparing only the CSS custom
property declarations and ignoring the file header:

- `analogous`, `complementary` and `triadic` produce **byte-identical**
  declarations. Every seed, every preset.
- Only `monochromatic` differs.
- The difference is 15 tokens, all neutrals: `gray-1`, `gray-3` through
  `gray-11`, plus `foreground-subtle`, `muted`, `border`, `input` and
  `sidebar-border`. For `#4DA0FF`, `gray-1` is `0 0% 93.3333%` under the three
  identical schemes and `240 3.0303% 93.5294%` under monochromatic.
- The accent scale, `--primary`, and the `--analogous` / `--complementary`
  harmony tokens are the same under all four.

Reproduce it before trusting any of the above.

### The cause I believe I found - verify it, do not take my word

`palette/index.js` renders with:

    generateExportCode(generatePalette({ hex: s, scheme }), { preset, format })

`palette/engine/generatePalette.js` declares `harmonized = false` as a default,
and nothing in this package ever passes it. With `harmonized` false, the
scheme's hue rotation is computed but never applied to the base colour:
`getAccentHue()` in `palette/engine/ColorTheory.js` returns +180 degrees for
complementary and +120/+240 for triadic, and that result does not reach the
output. The one scheme-dependent value that does survive is in
`createTintedNeutral()`, which uses 4% saturation for monochromatic and 2.5%
for everything else - which is exactly the neutral-only difference I measured.

### Rampkit does support this, and is where the engine came from

The upstream product is at `/Users/stian/Developer/nettsider/rampkit`
(live at rampkit.app). It exposes the feature this package never turned on:

- A **Color Harmony** toggle, on or off. URL: `rampkit.app/?hex=4DA0FF&harmonized=true`
- With it on, a **Harmony scheme** choice: Analogous ("Adjacent colors for
  harmony"), Complementary ("Opposite colors for contrast"), Triadic ("Three
  evenly spaced colors"), Monochromatic ("Single hue variations").
- A **Pure Color Theory** toggle, described in its own UI as off meaning
  "Optimized for accessibility and WCAG contrast".
- A **Select harmony color** picker - the scheme yields more than one candidate
  and you choose between them, e.g. `#6560EB` labelled "Analogous +30" as 1 of 2.

The important part: with harmony on, rampkit **transforms the base colour**.
`#4DA0FF` becomes `#6560EB`, and the ramp is built from that. Our package
always keeps the seed as the accent, which is why the scheme cannot show up.

`src/app/actions/generatePalette.ts` in that repo takes `harmonized` and
`pureColorTheory` and is the closest thing to a reference implementation.

Screenshots of that UI:
- `/Users/stian/Screenshots/Skjermbilde 2026-08-09 kl. 22.39.30.png`
- `/Users/stian/Screenshots/Skjermbilde 2026-08-09 kl. 22.39.33.png`
- `/Users/stian/Screenshots/Skjermbilde 2026-08-09 kl. 22.39.40.png`

### What I want from you

**Phase 1, audit only. Write it up and stop.**

1. Reproduce my measurements. Report what you actually get.
2. Confirm or refute the `harmonized` explanation by reading the vendored
   engine, and compare it against rampkit's own sources. Note any place the
   vendored copy has drifted - `palette/NOTICE.md` records deviations.
3. Answer the question that decides everything else: **should a scaffolder
   transform the brand colour somebody typed?** `--hex` is sold as "your brand
   colour". Complementary harmony would hand them a palette built on the
   opposite hue. That may be a legitimate option, but it cannot be a silent
   default, and it may not belong in this product at all.
4. Work out how harmony interacts with the contrast guarantees. This package
   corrects `--primary` and `--ring` against a visibility floor and checks
   pairs at 4.5, documented in `docs/reference/palette.md`. Rampkit's own UI
   frames Pure Color Theory as trading accessibility away. Establish whether a
   harmonised palette can still pass the existing contrast tests.
5. If a harmony colour can be one of several candidates, decide how a
   non-interactive CLI picks one. A flag that needs a carousel is a design
   problem.
6. Lay out the options with a recommendation, including "do nothing, and make
   the docs honest instead". Do not assume the fix is worth making.

**Phase 2, only after I approve.** Whatever we do, these must be true:

- Existing commands keep producing existing output. Someone who ran
  `--hex 4DA0FF --scheme analogous` last week must get the same theme today, or
  it is a breaking change and gets versioned as one.
- `create-next-app/src/options.js` `OPTION_CONTRACT` is the single source for
  flags, help and both generated tables. Change it there and regenerate:
  `node scripts/generate-cli-reference.mjs` then `--check`.
- The contrast tests and the deterministic 3x6 preset-format matrix in
  `create-next-app/test/` must still pass, and gain cases for whatever is added.
- `PROJECT.md`, `CHANGELOG.md`, `docs/reference/palette.md`,
  `docs/reference/cli.md` and the package README updated in the same change.

**Phase 3, the landing page.** Repo:
`/Users/stian/Developer/nettsider/larsen-create-next-app-site`.

The command builder currently offers all four schemes as equal choices, which
overstates what they do. It carries an honest note as of 2026-08-09, but if the
package changes, that note and the control both need revisiting. If harmony
becomes real, Stian wants it in the Colour section too, driving the live
page re-theme the same way the HEX input and preset swatches already do - see
`src/components/theme/site-theme.tsx`.

### House rules for both repos

- Never Tailwind. Vanilla CSS custom properties.
- Only `-` as a dash. Never an em dash or an en dash, anywhere.
- English in all files. Norwegian in conversation only.
- Verify, do not assert. This document is one agent's measurements; check them.
- A default is a decision. Changing generated output changes every future
  project, so bring it back to Stian rather than picking a direction.
- Never run `npm publish`. Stian publishes; 2FA is on the account.
