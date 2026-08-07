// @ts-check

/**
 * Regenerates the default theme master at CSS/theme.css.
 *
 * Usage (from the repo root):
 *   npm run gen:theme              -> uses the Larsen Utvikling brand blue
 *   npm run gen:theme -- "#22C55E" -> uses a custom seed
 *
 * The generated file is the baked-in default every scaffolded app gets when
 * the user answers "no" to the custom palette prompt. Hand-tweaks are fine -
 * just remember this script overwrites them on the next run.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { generateThemeCss, DEFAULT_HEX } from "./index.js";

const seed = process.argv[2] ?? DEFAULT_HEX;
const target = fileURLToPath(new URL("../CSS/theme.css", import.meta.url));

const css = generateThemeCss({
  hex: seed,
  preset: "shadcn",
  format: "hsl-values",
  scheme: "analogous",
});

writeFileSync(target, css);
console.log(`Wrote ${target}`);
console.log(`Seed: ${seed} | preset: shadcn | format: hsl-values | scheme: analogous`);
