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
import { formatColor, generateExportCode } from "./engine/export-formats.js";
import { hexToHSL, isValidHex } from "./engine/color-utils.js";

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

export const NEUTRAL_TINTS = ["subtle", "strong"];

const ENGINE_SCHEME_BY_NEUTRAL_TINT = {
  subtle: "analogous",
  strong: "monochromatic",
};

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
  neutralTint: "strong",
});

/**
 * The raw engine starts --primary and --ring from the seed color in both
 * modes. Extreme seeds therefore need separate mode seeds before export. The
 * shadcn exporter then keeps each selected seed only where the role-specific
 * visibility floor passes, or chooses the closest passing accent-scale step.
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
 * shadcn emits approved semantic token names. Radix Themes and CSS Variables
 * retain the Larsen base roles, while only Radix adds custom-palette override
 * names.
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
  // Both non-shadcn presets emit --background and --foreground, but neither
  // promises --muted or --border, so those roles use the shared gray scale.
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
 * @param {string} [opts.neutralTint]
 * @param {Record<string, string>} [opts.overrides] - token -> hex color,
 *   forced in both modes after generation (light gets the value, dark gets
 *   its counterpart from darkOverrides)
 * @param {Record<string, string>} [opts.darkOverrides] - token -> hex color
 *   forced in the dark block
 * @param {string} [opts.append] - extra CSS appended verbatim at the end
 *   (used by generate-default.mjs for the brand accent block)
 * @returns {string} complete theme.css content
 */
export function generateThemeCss(opts) {
  if (Object.hasOwn(opts, "scheme")) {
    throw new Error(
      'The "scheme" option was removed. Use neutralTint: "subtle" or "strong" instead.',
    );
  }
  const {
    hex,
    darkHex,
    preset = "shadcn",
    format = "hsl-values",
    neutralTint = "subtle",
    overrides,
    darkOverrides,
    append = "",
  } = opts;
  if (!isValidHex(hex)) {
    throw new Error(`Invalid HEX color: "${hex}" (expected e.g. 0A0A0A or #0A0A0A)`);
  }
  const hasDarkHex = darkHex !== null && darkHex !== undefined;
  if (hasDarkHex && !isValidHex(darkHex)) {
    throw new Error(
      `Invalid dark HEX color: "${String(darkHex)}" (expected e.g. 0A0A0A or #0A0A0A)`,
    );
  }
  if (!(preset in PRESETS)) {
    throw new Error(`Unknown preset: "${preset}" (expected ${Object.keys(PRESETS).join(" | ")})`);
  }
  if (!(format in FORMATS)) {
    throw new Error(`Unknown format: "${format}" (expected ${Object.keys(FORMATS).join(" | ")})`);
  }
  if (!NEUTRAL_TINTS.includes(neutralTint)) {
    throw new Error(
      `Unknown neutral tint: "${neutralTint}" (expected ${NEUTRAL_TINTS.join(" | ")})`,
    );
  }

  const seed = normalizeHex(hex);
  const normalizedDarkHex = hasDarkHex ? normalizeHex(darkHex) : undefined;
  const normalizedOverrides = normalizeOverrides(overrides, "overrides");
  const normalizedDarkOverrides = normalizeOverrides(darkOverrides, "darkOverrides");
  const { lightSeed, darkSeed } = seedsForModes(seed, normalizedDarkHex);
  const roles = tokenRoles(preset, format);
  const engineScheme = ENGINE_SCHEME_BY_NEUTRAL_TINT[neutralTint];

  const render = (/** @type {string} */ s) =>
    extractBlocks(
      generateExportCode(generatePalette({ hex: s, semanticSeed: seed, scheme: engineScheme }), {
        preset,
        format: FORMATS[format],
      }),
    );

  // An extreme seed makes one mode unusable from a single run, so each mode
  // is rendered from the seed that actually works in it.
  let { light } = render(lightSeed);
  let dark = darkSeed ? render(darkSeed).dark : render(lightSeed).dark;

  light = applyOverrides(light, normalizedOverrides, format);
  dark = applyOverrides(dark, normalizedDarkOverrides ?? normalizedOverrides, format);

  return `/**
 * theme.css - color tokens
 *
 * Generated by @larsen-utvikling/create-next-app (rampkit engine).
 * Seed: ${seed}${darkSeed ? ` (light from ${lightSeed}, dark from ${darkSeed})` : ""} | preset: ${preset} | format: ${format} | neutral tint: ${neutralTint}
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

/** Normalize caller-owned override colors before passing them to the renderer. */
function normalizeOverrides(values, optionName) {
  if (!values) return undefined;
  return Object.fromEntries(
    Object.entries(values).map(([token, value]) => [
      token,
      normalizeOverrideHex(value, token, optionName),
    ]),
  );
}

/** Normalize one caller-owned override color and preserve its token name. */
function normalizeOverrideHex(value, token, optionName) {
  if (
    typeof value !== "string" ||
    !/^#?(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
  ) {
    throw new Error(
      `Invalid ${optionName} override color for "--${token}": "${String(value)}" ` +
        "(expected 3, 6, or 8 digit HEX)",
    );
  }
  return normalizeHex(value);
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
    const value = formatColor(normalizeHex(hex), FORMATS[format]);
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
