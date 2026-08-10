// @ts-check

/**
 * Regenerates the default theme master at CSS/theme.css.
 *
 * The default mirrors larsenutvikling.no: the palette is generated from the
 * Larsen Utvikling brand blue, so accents and buttons read blue, while the
 * page surfaces and the focus ring are pinned to the exact black/white pair
 * the brand uses.
 *
 * Usage (from the repo root):
 *   npm run gen:theme              -> brand default (blue accents, strong neutral tint)
 *   npm run gen:theme -- "#22C55E" -> custom seed, plain generated surfaces
 *   npm run gen:theme -- "#22C55E" subtle -> custom seed and neutral tint
 *
 * Hand-tweaks to CSS/theme.css are fine - this script overwrites them.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_THEME, NEUTRAL_TINTS, generateThemeCss } from "./index.js";

const seed = process.argv[2] ?? DEFAULT_THEME.hex;
const neutralTint = process.argv[3] ?? DEFAULT_THEME.neutralTint;
// A custom seed gets the plain generated palette; only the brand default
// pins the black/white surface and ring.
const custom = Boolean(process.argv[2]);
if (!NEUTRAL_TINTS.includes(neutralTint)) {
  console.error(
    `Unknown neutral tint "${neutralTint}" (expected ${NEUTRAL_TINTS.join(" | ")})`,
  );
  process.exit(1);
}
const target = fileURLToPath(new URL("../CSS/theme.css", import.meta.url));

/**
 * Softer and subtler blues than the generated scale provides, carried over
 * from larsenutvikling.no. Only the subtle tint flips between light and dark.
 */
const BRAND_ACCENTS = `
/* Brand accents - Larsen Utvikling blue (larsenutvikling.no) */
:root {
  --brand-blue: 212 100% 65%;
  --brand-blue-soft: 213 52% 25%;
  --brand-blue-subtle: 213 100% 94%;
}

@media (prefers-color-scheme: dark) {
  :root {
    --brand-blue-subtle: 213 50% 16%;
  }
}

[data-theme="light"] {
  --brand-blue-subtle: 213 100% 94%;
}

[data-theme="dark"] {
  --brand-blue-subtle: 213 50% 16%;
}
`;

/**
 * The brand keeps pages true black and white and uses blue for accents, so
 * the surface pair and the focus ring are pinned rather than taken from the
 * blue-derived scale. Pinning --ring also keeps focus indicators above the
 * WCAG 3:1 requirement, which the brand blue misses on a white surface.
 */
const WHITE = "#FAFAFA";
const BLACK = "#0A0A0A";
const brandLight = {
  background: WHITE,
  foreground: BLACK,
  card: WHITE,
  "card-foreground": BLACK,
  popover: WHITE,
  "popover-foreground": BLACK,
  ring: BLACK,
  sidebar: WHITE,
  "sidebar-foreground": BLACK,
  "sidebar-ring": BLACK,
};
const brandDark = {
  background: BLACK,
  foreground: WHITE,
  "card-foreground": WHITE,
  "popover-foreground": WHITE,
  ring: WHITE,
  "sidebar-foreground": WHITE,
  "sidebar-ring": WHITE,
};

const css = generateThemeCss({
  hex: seed,
  preset: DEFAULT_THEME.preset,
  format: DEFAULT_THEME.format,
  neutralTint,
  overrides: custom ? undefined : brandLight,
  darkOverrides: custom ? undefined : brandDark,
  append: BRAND_ACCENTS,
});

writeFileSync(target, css);
console.log(`Wrote ${target}`);
console.log(
  `Seed: ${seed} | preset: ${DEFAULT_THEME.preset} | format: ${DEFAULT_THEME.format} | neutral tint: ${neutralTint}` +
    (custom ? "" : " | brand surfaces and ring pinned, brand accents appended"),
);
