// @ts-check

import Color from "colorjs.io";

export const CONTRAST_PRESETS = Object.freeze(["shadcn", "radix", "css-variables"]);
export const CONTRAST_FORMATS = Object.freeze([
  "hex",
  "rgb",
  "hsl",
  "hsl-values",
  "oklab",
  "oklch",
]);

const textPair = (token, against) =>
  Object.freeze({ token, against, minimum: 4.6, standard: "WCAG-margin" });

const nonTextPair = (token, against, minimum) =>
  Object.freeze({ token, against, minimum, standard: "WCAG" });

const visibilityPair = (token, against, minimum) =>
  Object.freeze({ token, against, minimum, standard: "visibility-floor" });

const harmonyAndStatusChecks = () => [
  textPair("analogous-foreground", "analogous"),
  textPair("complementary-foreground", "complementary"),
  ...["success", "danger", "warning", "info"].flatMap((name) => [
    textPair(`${name}-foreground`, name),
    textPair(`${name}-muted-foreground`, `${name}-muted`),
  ]),
];

const SHADCN_CHECKS = Object.freeze([
  textPair("foreground", "background"),
  textPair("foreground-subtle", "background"),
  textPair("card-foreground", "card"),
  textPair("popover-foreground", "popover"),
  nonTextPair("ring", "background", 3),
  nonTextPair("ring", "card", 3),
  nonTextPair("ring", "popover", 3),
  nonTextPair("input", "background", 3),
  nonTextPair("input", "card", 3),
  nonTextPair("input", "popover", 3),
  textPair("primary-foreground", "primary"),
  visibilityPair("primary", "background", 1.5),
  visibilityPair("primary", "card", 1.5),
  visibilityPair("primary", "popover", 1.5),
  textPair("secondary-foreground", "secondary"),
  textPair("muted-foreground", "muted"),
  textPair("accent-foreground", "accent"),
  textPair("destructive-foreground", "destructive"),
  ...harmonyAndStatusChecks(),
]);

const RADIX_CHECKS = Object.freeze([
  textPair("foreground", "background"),
  textPair("accent-contrast", "accent-9"),
  textPair("gray-contrast", "gray-9"),
  ...harmonyAndStatusChecks(),
]);

const CSS_VARIABLE_CHECKS = Object.freeze([
  textPair("foreground", "background"),
  ...harmonyAndStatusChecks(),
]);

export const CONTRAST_CHECKS_BY_PRESET = Object.freeze({
  shadcn: SHADCN_CHECKS,
  radix: RADIX_CHECKS,
  "css-variables": CSS_VARIABLE_CHECKS,
});

// Backward-compatible authority for consumers that used the original
// shadcn-only verifier without options.
export const CONTRAST_PRESET = "shadcn";
export const CONTRAST_FORMAT = "hsl-values";
export const CONTRAST_CHECKS = SHADCN_CHECKS;

/** @param {string} css @param {string} from @param {string} to */
function block(css, from, to) {
  const start = css.indexOf(from);
  const end = to === "" ? css.length : css.indexOf(to, start);
  if (start === -1 || end === -1) return {};
  const segment = css.slice(start, end);
  /** @type {Record<string, string>} */
  const tokens = {};
  for (const match of segment.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    if (!(match[1] in tokens)) tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

/** @param {string} value @param {string} format */
function parseColor(value, format) {
  return new Color(format === "hsl-values" ? `hsl(${value})` : value);
}

/** @param {string} a @param {string} b @param {string} format */
function ratio(a, b, format) {
  return parseColor(a, format).contrastWCAG21(parseColor(b, format));
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
  const requiredTokens = [...new Set(checks.flatMap(({ token, against }) => [token, against]))];
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

  for (const [mode, tokens] of [
    ["light", block(css, ":root {", "@media")],
    ["dark", block(css, "@media", '[data-theme="light"]')],
  ]) {
    const values = /** @type {Record<string, string>} */ (tokens);
    const missingInMode = requiredTokens.filter((token) => !values[token]);
    missing.push(...missingInMode.map((token) => `${mode}: missing --${token}`));
    if (missingInMode.length > 0) continue;

    for (const check of checks) {
      let actual = Number.NaN;
      try {
        actual = ratio(values[check.token], values[check.against], format);
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
        `${mode} --${token} vs --${against} = ${Number.isFinite(actual) ? actual.toFixed(2) : "non-finite"} (needs ${minimum})`,
      );
    }
  }
  return failures;
}
