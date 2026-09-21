// @ts-check

import Color from "colorjs.io";

import { parseThemeTokens } from "./tokens.js";
export const CONTRAST_PRESETS = Object.freeze(["shadcn", "radix", "canonical"]);
export const CONTRAST_FORMATS = Object.freeze([
  "hex",
  "rgb",
  "hsl",
  "hsl-values",
  "oklab",
  "oklch",
]);
const textPair = (token, against) => ({
  token,
  against,
  minimum: 4.6,
  standard: "WCAG-margin",
});
const controlPair = (token, against) => ({
  token,
  against,
  minimum: 3,
  standard: "WCAG",
});
export const CONTRAST_CHECKS_BY_PRESET = Object.freeze({
  shadcn: [
    textPair("foreground", "background"),
    textPair("foreground", "muted"),
    textPair("card-foreground", "card"),
    textPair("popover-foreground", "popover"),
    textPair("primary-foreground", "primary"),
    textPair("secondary-foreground", "secondary"),
    textPair("muted-foreground", "muted"),
    textPair("accent-foreground", "accent"),
    ...["destructive", "success", "warning", "info"].flatMap((role) => [
      textPair(`${role}-foreground`, role),
      textPair(`${role}-muted-foreground`, `${role}-muted`),
    ]),
    ...["background", "card", "popover"].flatMap((surface) => [
      controlPair("ring", surface),
      controlPair("input", surface),
    ]),
  ],
  radix: [
    textPair("gray-12", "color-background"),
    textPair("gray-12", "gray-2"),
    textPair("accent-contrast", "accent-9"),
    textPair("gray-contrast", "gray-9"),
  ],
  canonical: [
    textPair("cpe-canvas-foreground", "cpe-canvas"),
    textPair("cpe-canvas-foreground", "cpe-surface"),
    textPair("cpe-action-primary-foreground", "cpe-action-primary-solid"),
    controlPair("cpe-control-border", "cpe-control-background"),
  ],
});
export const CONTRAST_PRESET = "shadcn";
export const CONTRAST_FORMAT = "hsl-values";
export const CONTRAST_CHECKS = CONTRAST_CHECKS_BY_PRESET.shadcn;

/** @param {string} value @param {string} format */
function parseColor(value, format) {
  return new Color(format === "hsl-values" ? `hsl(${value})` : value);
}

/** WCAG 2.x uses its normative sRGB weights, not general XYZ-D65 Y.
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * Color.js is used only to parse/convert the serialized CSS color.
 */
export function wcagRelativeLuminance(value, format) {
  const channels = parseColor(value, format).to("srgb").coords;
  const linear = channels.map(channel => {
    const c = Math.max(0, Math.min(1, channel));
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function wcagContrastRatio(a, b, format = "rgb") {
  const first = wcagRelativeLuminance(a, format);
  const second = wcagRelativeLuminance(b, format);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * Returns structured contrast measurements for both generated modes.
 *
 * @param {string} css
 * @param {{ preset?: string, format?: string }} [options]
 */
export function measureThemeContrast(
  css,
  { preset = CONTRAST_PRESET, format = CONTRAST_FORMAT } = {},
) {
  if (!CONTRAST_PRESETS.includes(preset)) {
    throw new Error(`Unsupported contrast preset: ${preset}`);
  }
  if (!CONTRAST_FORMATS.includes(format)) {
    throw new Error(`Unsupported contrast format: ${format}`);
  }

  const checks = CONTRAST_CHECKS_BY_PRESET[preset];
  const requiredTokens = [
    ...new Set(checks.flatMap(({ token, against }) => [token, against])),
  ];
  /** @type {string[]} */
  const missing = [];
  /** @type {Array<{
   *   mode: string,
   *   token: string,
   *   against: string,
   *   minimum: number,
   *   standard: string,
   *   actual: number,
   * }>} */
  const measurements = [];

  for (const [mode, tokens] of [...Object.entries(parseThemeTokens(css))]) {
    const values = /** @type {Record<string, string>} */ (tokens);
    const missingInMode = requiredTokens.filter((token) => !values[token]);
    missing.push(
      ...missingInMode.map((token) => `${mode}: missing --${token}`),
    );
    if (missingInMode.length > 0) continue;

    for (const check of checks) {
      let actual = Number.NaN;
      try {
        actual = wcagContrastRatio(values[check.token], values[check.against], format);
      } catch {
        // A malformed serialized value is reported by the same non-finite
        // failure path as any other unmeasurable contrast result.
      }
      measurements.push({ mode, ...check, actual });
    }
  }

  return { missing, measurements };
}

/**
 * Verifies the documented role pairs in both modes for every generated preset
 * and format. With no options it preserves the original shadcn x hsl-values
 * behavior.
 *
 * @param {string} css
 * @param {{ preset?: string, format?: string }} [options]
 * @returns {string[]}
 */
export function checkThemeContrast(css, options) {
  const { missing, measurements } = measureThemeContrast(css, options);
  const failures = [...missing];
  for (const { mode, token, against, minimum, actual } of measurements) {
    if (!Number.isFinite(actual) || actual < minimum) {
      failures.push(
        `${mode} --${token} vs --${against} = ${Number.isFinite(actual) ? actual.toFixed(6) : "non-finite"} (needs ${minimum})`,
      );
    }
  }
  return failures;
}
