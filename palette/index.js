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

import Color from "colorjs.io";
import { generatePalette } from "./engine/generatePalette.js";
import { generateExportCode } from "./engine/export-formats.js";
import { hexToHSL, hexToRGB, isValidHex } from "./engine/color-utils.js";

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
 * The baked-in default: the whole palette generated from the Larsen
 * Utvikling brand blue, so accents read blue, while generate-default.mjs
 * pins the page surfaces and focus ring to the exact black/white pair the
 * brand uses (larsenutvikling.no does the same).
 */
export const DEFAULT_THEME = /** @type {const} */ ({
  hex: "#4DA0FF", // hsl(212 100% 65%) - --brand-blue on larsenutvikling.no
  preset: "shadcn",
  format: "hsl-values",
  scheme: "monochromatic",
});

/**
 * The engine keeps --primary and --ring at the seed color in BOTH modes, so
 * an extreme seed makes one mode unusable: a near-black seed yields a
 * near-black primary on the near-black dark surface (about 1:1 contrast -
 * invisible buttons and focus rings), and a near-white seed does the same to
 * light mode. Past these thresholds each mode is generated from its own seed.
 */
const EXTREME_LIGHTNESS = { min: 15, max: 85 };

/**
 * Seeds for the light and dark blocks. Light mode needs a dark accent and
 * dark mode needs a light one, so an extreme seed is paired with its
 * lightness-inverted counterpart and each is assigned to the mode it works in.
 *
 * @param {string} hex - normalized seed
 * @param {string} [explicitDark] - normalized dark seed chosen by the caller
 * @returns {{ lightSeed: string, darkSeed: string | undefined }} darkSeed is
 *   undefined when one run serves both modes
 */
export function seedsForModes(hex, explicitDark) {
  if (explicitDark) {
    const pair = [hex, explicitDark].sort((a, b) => hexToHSL(a).l - hexToHSL(b).l);
    return { lightSeed: pair[0], darkSeed: pair[1] };
  }
  const { h, s, l } = hexToHSL(hex);
  if (l >= EXTREME_LIGHTNESS.min && l <= EXTREME_LIGHTNESS.max) {
    return { lightSeed: hex, darkSeed: undefined };
  }
  const counterpart = normalizeHex(
    new Color("hsl", [h, s, 100 - l]).to("srgb").toString({ format: "hex" }),
  );
  return l < EXTREME_LIGHTNESS.min
    ? { lightSeed: hex, darkSeed: counterpart }
    : { lightSeed: counterpart, darkSeed: hex };
}

/**
 * Formats a hex color the same way the engine formats palette values, so
 * token overrides match the rest of the file.
 * @param {string} hex
 * @param {keyof typeof FORMATS} format
 */
function formatValue(hex, format) {
  switch (format) {
    case "hsl-values": {
      const { h, s, l } = hexToHSL(hex);
      return `${h} ${s}% ${l}%`;
    }
    case "hsl": {
      const { h, s, l } = hexToHSL(hex);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    case "rgb": {
      const { r, g, b } = hexToRGB(hex);
      return `rgb(${r}, ${g}, ${b})`;
    }
    case "oklab":
      return new Color(hex).to("oklab").toString({ precision: 4 });
    case "oklch":
      return new Color(hex).to("oklch").toString({ precision: 4 });
    default:
      return hex;
  }
}

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
  // The scale presets emit --background and --foreground too, but no --muted
  // or --border, so those two roles fall back to the gray scale.
  radix: {
    background: "background",
    foreground: "foreground",
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
 * @param {string} [opts.darkHex] - separate seed for the dark block. Defaults
 *   to an inverted counterpart when the seed is near-black or near-white
 *   (see counterpartSeed); pass null-ish only if you truly want one run.
 * @param {keyof typeof PRESETS} [opts.preset]
 * @param {keyof typeof FORMATS} [opts.format]
 * @param {string} [opts.scheme]
 * @param {Record<string, string>} [opts.overrides] - token -> hex color,
 *   forced in both modes after generation (light gets the value, dark gets
 *   its counterpart from darkOverrides)
 * @param {Record<string, string>} [opts.darkOverrides] - token -> hex color
 *   forced in the dark block
 * @param {string} [opts.append] - extra CSS appended verbatim at the end
 *   (used by generate-default.mjs for the brand accent block)
 * @returns {string} complete theme.css content
 */
export function generateThemeCss({
  hex,
  darkHex,
  preset = "shadcn",
  format = "hsl-values",
  scheme = "analogous",
  overrides,
  darkOverrides,
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
  const { lightSeed, darkSeed } = seedsForModes(seed, darkHex ? normalizeHex(darkHex) : undefined);
  const roles = tokenRoles(preset, format);

  const render = (/** @type {string} */ s) =>
    extractBlocks(
      generateExportCode(generatePalette({ hex: s, scheme }), {
        preset,
        format: FORMATS[format],
      }),
    );

  // An extreme seed makes one mode unusable from a single run, so each mode
  // is rendered from the seed that actually works in it.
  let { light } = render(lightSeed);
  let dark = darkSeed ? render(darkSeed).dark : render(lightSeed).dark;

  light = applyOverrides(light, overrides, format);
  dark = applyOverrides(dark, darkOverrides ?? overrides, format);

  return `/**
 * theme.css - color tokens
 *
 * Generated by @larsen-utvikling/create-next-app (rampkit engine).
 * Seed: ${seed}${darkSeed ? ` (light from ${lightSeed}, dark from ${darkSeed})` : ""} | preset: ${preset} | format: ${format} | scheme: ${scheme}
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
 * Replaces token values in a declaration block. Tokens not already present
 * are appended, so overrides always take effect.
 * @param {string} block
 * @param {Record<string, string> | undefined} overrides - token -> hex color
 * @param {keyof typeof FORMATS} format
 */
function applyOverrides(block, overrides, format) {
  if (!overrides) return block;
  let out = block;
  for (const [token, hex] of Object.entries(overrides)) {
    const value = formatValue(normalizeHex(hex), format);
    const pattern = new RegExp(`(--${token}:)[^;]*;`);
    out = pattern.test(out)
      ? out.replace(pattern, `$1 ${value};`)
      : `${out.trimEnd()}\n  --${token}: ${value};`;
  }
  return out;
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
