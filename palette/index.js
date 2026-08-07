// @ts-check

/**
 * palette/index.js - the ONLY entry point to the color generator.
 *
 * Everything under engine/ is vendored from rampkit (see NOTICE.md) and must
 * never be imported directly by the CLI. This module:
 *
 *   1. runs the rampkit engine (hex -> full palette data)
 *   2. renders it with the chosen preset + color format
 *   3. re-wraps the output in the template's dark mode structure
 *      (prefers-color-scheme auto + [data-theme] manual override)
 *   4. appends a small "document defaults" rule block (body, selection, hr)
 *      written with the real token names and the correct usage idiom for the
 *      chosen preset/format combination - no invented alias tokens
 */

import { generatePalette } from "./engine/generatePalette.js";
import { generateExportCode } from "./engine/export-formats.js";
import { isValidHex } from "./engine/color-utils.js";

/** CLI-facing names -> engine enums */
export const PRESETS = /** @type {const} */ ({
  shadcn: "shadcn",
  radix: "radix",
  "css-variables": "css-variables",
});

export const FORMATS = /** @type {const} */ ({
  hex: "HEX",
  rgb: "RGB",
  hsl: "HSL",
  "hsl-values": "HSL_VALUES",
  oklab: "OKLAB",
  oklch: "OKLCH",
});

export const SCHEMES = ["analogous", "monochromatic", "complementary", "triadic"];

/**
 * The baked-in default: monochromatic palette seeded with near-black, exactly
 * like larsenutvikling.no (light derived from #0A0A0A, dark inverted), with
 * the brand blue appended as a separate accent block by generate-default.mjs.
 */
export const DEFAULT_THEME = /** @type {const} */ ({
  hex: "#0A0A0A",
  preset: "shadcn",
  format: "hsl-values",
  scheme: "monochromatic",
});

export { isValidHex };

/** @param {string} hex */
export function normalizeHex(hex) {
  const clean = hex.trim().replace(/^#/, "").toUpperCase();
  return `#${clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean}`;
}

/**
 * CSS usage idioms for the chosen color format - used in the generated
 * AGENTS.md/DESIGN.md so docs always match the palette architecture.
 * @param {keyof typeof FORMATS} format
 */
export function usageIdioms(format) {
  if (format === "hsl-values") {
    return {
      idiom: "hsl(var(--token))",
      alphaIdiom: "hsl(var(--token) / 0.75)",
    };
  }
  return {
    idiom: "var(--token)",
    alphaIdiom: "color-mix(in srgb, var(--token) 75%, transparent)",
  };
}

/**
 * Semantic roles -> the real token name each preset provides for that role.
 * shadcn emits semantic tokens; radix/css-variables emit only the scales.
 */
const ROLE_TOKENS = {
  shadcn: {
    background: "background",
    foreground: "foreground",
    muted: "muted",
    accentSolid: "accent-9",
    accentSoft: "accent-3",
    line: "border",
  },
  radix: {
    background: "gray-1",
    foreground: "gray-12",
    muted: "gray-2",
    accentSolid: "accent-9",
    accentSoft: "accent-3",
    line: "gray-6",
  },
};
ROLE_TOKENS["css-variables"] = ROLE_TOKENS.radix;

/**
 * For a preset/format combo, returns per-role { name, expr }: the actual
 * token name (for docs/UI) and the ready-to-use CSS expression (for styles).
 *
 * @param {keyof typeof PRESETS} preset
 * @param {keyof typeof FORMATS} format
 * @returns {Record<"background" | "foreground" | "muted" | "accentSolid" | "accentSoft" | "line", { name: string, expr: string }>}
 */
export function tokenRoles(preset, format) {
  const wrap =
    format === "hsl-values"
      ? (/** @type {string} */ t) => `hsl(var(--${t}))`
      : (/** @type {string} */ t) => `var(--${t})`;
  const roles = ROLE_TOKENS[preset];
  return /** @type {any} */ (
    Object.fromEntries(
      Object.entries(roles).map(([role, token]) => [
        role,
        { name: `--${token}`, expr: wrap(token) },
      ]),
    )
  );
}

/**
 * @param {object} opts
 * @param {string} opts.hex - seed color, with or without leading '#'
 * @param {keyof typeof PRESETS} [opts.preset]
 * @param {keyof typeof FORMATS} [opts.format]
 * @param {string} [opts.scheme]
 * @param {string} [opts.append] - extra CSS appended verbatim at the end
 *   (used by generate-default.mjs for the brand accent block)
 * @returns {string} complete theme.css content
 */
export function generateThemeCss({
  hex,
  preset = "shadcn",
  format = "hsl-values",
  scheme = "analogous",
  append = "",
}) {
  if (!isValidHex(hex)) {
    throw new Error(`Invalid HEX color: "${hex}" (expected e.g. 0A0A0A or #0A0A0A)`);
  }
  if (!(preset in PRESETS)) {
    throw new Error(`Unknown preset: "${preset}" (expected ${Object.keys(PRESETS).join(" | ")})`);
  }
  if (!(format in FORMATS)) {
    throw new Error(`Unknown format: "${format}" (expected ${Object.keys(FORMATS).join(" | ")})`);
  }
  if (!SCHEMES.includes(scheme)) {
    throw new Error(`Unknown scheme: "${scheme}" (expected ${SCHEMES.join(" | ")})`);
  }

  const seed = normalizeHex(hex);
  const data = generatePalette({ hex: seed, scheme });
  const raw = generateExportCode(data, { preset, format: FORMATS[format] });
  const { light, dark } = extractBlocks(raw);
  const roles = tokenRoles(preset, format);

  return `/**
 * theme.css - color tokens
 *
 * Generated by @larsen-utvikling/create-next-app (rampkit engine).
 * Seed: ${seed} | preset: ${preset} | format: ${format} | scheme: ${scheme}
 *
 * Dark mode follows the OS automatically. Set data-theme="light" or
 * data-theme="dark" on <html> to override manually - no JS shipped.
 * Regenerate any time by re-running the scaffolder, or edit values freely.
 */

:root {
${indent(light, 2)}
}

@media (prefers-color-scheme: dark) {
  :root {
${indent(dark, 4)}
  }
}

[data-theme="light"] {
${indent(light, 2)}
}

[data-theme="dark"] {
${indent(dark, 2)}
}

/* Document defaults - written for ${preset} x ${format} */
body {
  background: ${roles.background.expr};
  color: ${roles.foreground.expr};
}

::selection {
  background: ${roles.accentSoft.expr};
  color: ${roles.foreground.expr};
}

hr {
  border-top-color: ${roles.line.expr};
}
${append ? `\n${append.trim()}\n` : ""}`;
}

/**
 * Split the engine's output (":root { ... } @media (dark) { :root { ... } }")
 * into the light and dark declaration lists.
 * @param {string} css
 */
function extractBlocks(css) {
  const mediaIdx = css.indexOf("@media (prefers-color-scheme: dark)");
  if (mediaIdx === -1) {
    throw new Error("Unexpected engine output: missing dark mode block");
  }
  const light = innerBlock(css.slice(0, mediaIdx));
  const darkPart = css.slice(mediaIdx);
  const rootIdx = darkPart.indexOf(":root");
  const dark = innerBlock(darkPart.slice(rootIdx));
  return { light, dark };
}

/** Extract the contents of the first balanced { ... } block. @param {string} str */
function innerBlock(str) {
  const open = str.indexOf("{");
  if (open === -1) throw new Error("Unexpected engine output: no block found");
  let depth = 0;
  for (let i = open; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) return str.slice(open + 1, i);
    }
  }
  throw new Error("Unexpected engine output: unbalanced braces");
}

/** Normalize indentation of a declaration block. @param {string} block @param {number} spaces */
function indent(block, spaces) {
  const pad = " ".repeat(spaces);
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => pad + line)
    .join("\n");
}
