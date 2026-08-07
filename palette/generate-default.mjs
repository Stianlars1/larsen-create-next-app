// @ts-check

/**
 * Regenerates the default theme master at CSS/theme.css.
 *
 * The default mirrors larsenutvikling.no: a monochromatic palette seeded
 * with near-black (#0A0A0A light, inverted dark), plus the Larsen Utvikling
 * brand blue appended as a separate accent block.
 *
 * Usage (from the repo root):
 *   npm run gen:theme              -> brand default (#0A0A0A, monochromatic)
 *   npm run gen:theme -- "#22C55E" -> custom seed (still monochromatic default
 *                                     structure; pass a second arg for scheme)
 *
 * Hand-tweaks to CSS/theme.css are fine - this script overwrites them.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEFAULT_THEME, SCHEMES, generateThemeCss } from "./index.js";

const seed = process.argv[2] ?? DEFAULT_THEME.hex;
const scheme = process.argv[3] ?? DEFAULT_THEME.scheme;
if (!SCHEMES.includes(scheme)) {
  console.error(`Unknown scheme "${scheme}" (expected ${SCHEMES.join(" | ")})`);
  process.exit(1);
}
const target = fileURLToPath(new URL("../CSS/theme.css", import.meta.url));

/**
 * Brand accents layered on top of the monochromatic palette, exactly like
 * larsenutvikling.no. Only the subtle tint flips between light and dark.
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

const css = generateThemeCss({
  hex: seed,
  preset: DEFAULT_THEME.preset,
  format: DEFAULT_THEME.format,
  scheme,
  append: BRAND_ACCENTS,
});

writeFileSync(target, css);
console.log(`Wrote ${target}`);
console.log(`Seed: ${seed} | preset: ${DEFAULT_THEME.preset} | format: ${DEFAULT_THEME.format} | scheme: ${scheme} | brand accents appended`);
