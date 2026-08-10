// @ts-check

export const CONTRAST_PRESET = "shadcn";
export const CONTRAST_FORMAT = "hsl-values";
export const CONTRAST_CHECKS = Object.freeze([
  Object.freeze({
    token: "foreground",
    against: "background",
    minimum: 4.5,
    standard: "WCAG",
  }),
  Object.freeze({
    token: "card-foreground",
    against: "card",
    minimum: 4.5,
    standard: "WCAG",
  }),
  Object.freeze({
    token: "popover-foreground",
    against: "popover",
    minimum: 4.5,
    standard: "WCAG",
  }),
  Object.freeze({ token: "ring", against: "background", minimum: 3, standard: "WCAG" }),
  // SC 1.4.11: the input border is the only thing identifying a text field,
  // select or outline button, and it has to hold on every surface those sit
  // on. --border is deliberately absent - cards and separators are not user
  // interface components.
  Object.freeze({ token: "input", against: "background", minimum: 3, standard: "WCAG" }),
  Object.freeze({ token: "input", against: "card", minimum: 3, standard: "WCAG" }),
  Object.freeze({ token: "input", against: "popover", minimum: 3, standard: "WCAG" }),
  Object.freeze({
    token: "primary-foreground",
    against: "primary",
    minimum: 4.5,
    standard: "WCAG",
  }),
  Object.freeze({
    token: "primary",
    against: "background",
    minimum: 1.5,
    standard: "visibility-floor",
  }),
]);

const REQUIRED_TOKENS = [
  ...new Set(CONTRAST_CHECKS.flatMap(({ token, against }) => [token, against])),
];

/**
 * Verifies a shadcn hsl-values theme in both modes. Required tokens are
 * reported as failures instead of being skipped, then the exact exported
 * contrast checks are evaluated. Other preset-format combinations are not
 * supported by this parser.
 *
 * @param {string} css
 * @returns {string[]} human-readable failures
 */
export function checkThemeContrast(css) {
  const block = (/** @type {string} */ from, /** @type {string} */ to) => {
    const start = css.indexOf(from);
    const end = to === "" ? css.length : css.indexOf(to, start);
    if (start === -1 || end === -1) return {};
    const segment = css.slice(start, end);
    /** @type {Record<string, string>} */
    const tokens = {};
    for (const match of segment.matchAll(
      /--([a-z0-9-]+):\s*([0-9.]+ [0-9.]+% [0-9.]+%)/g,
    )) {
      if (!(match[1] in tokens)) tokens[match[1]] = match[2];
    }
    return tokens;
  };

  /** Relative luminance from an H S% L% triplet using the WCAG formula. */
  const luminance = (/** @type {string} */ triplet) => {
    const [h, s, l] = triplet.split(" ").map(parseFloat);
    const saturation = s / 100;
    const lightness = l / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const second = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const offset = lightness - chroma / 2;
    const [r, g, b] = (
      h < 60 ? [chroma, second, 0]
      : h < 120 ? [second, chroma, 0]
      : h < 180 ? [0, chroma, second]
      : h < 240 ? [0, second, chroma]
      : h < 300 ? [second, 0, chroma]
      : [chroma, 0, second]
    ).map((value) => {
      const channel = value + offset;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const ratio = (/** @type {string} */ a, /** @type {string} */ b) => {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (lighter + 0.05) / (darker + 0.05);
  };

  /** @type {string[]} */
  const failures = [];
  for (const [mode, tokens] of [
    ["light", block(":root {", "@media")],
    ["dark", block("@media", '[data-theme="light"]')],
  ]) {
    const values = /** @type {Record<string, string>} */ (tokens);
    for (const token of REQUIRED_TOKENS) {
      if (!values[token]) failures.push(`${mode}: missing --${token}`);
    }
    if (REQUIRED_TOKENS.some((token) => !values[token])) continue;

    for (const { token: name, against, minimum } of CONTRAST_CHECKS) {
      const actual = ratio(
        values[/** @type {string} */ (name)],
        values[/** @type {string} */ (against)],
      );
      if (actual < /** @type {number} */ (minimum)) {
        failures.push(
          `${mode} --${name} vs --${against} = ${actual.toFixed(2)} (needs ${minimum})`,
        );
      }
    }
  }
  return failures;
}
