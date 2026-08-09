import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);
const { generateThemeCss } = fixture.api;

const SHADCN_TOKENS = [
  "background", "foreground", "foreground-subtle", "primary",
  "primary-foreground", "secondary", "secondary-foreground", "muted",
  "muted-foreground", "accent", "accent-foreground", "destructive",
  "destructive-foreground", "border", "input", "ring", "analogous",
  "analogous-foreground", "complementary", "complementary-foreground",
  "accent-1", "accent-2", "accent-3", "accent-4", "accent-5", "accent-6",
  "accent-7", "accent-8", "accent-9", "accent-10", "accent-11", "accent-12",
  "gray-1", "gray-2", "gray-3", "gray-4", "gray-5", "gray-6", "gray-7",
  "gray-8", "gray-9", "gray-10", "gray-11", "gray-12",
  "success", "success-foreground", "success-muted",
  "success-muted-foreground", "success-border", "danger",
  "danger-foreground", "danger-muted", "danger-muted-foreground",
  "danger-border", "warning", "warning-foreground", "warning-muted",
  "warning-muted-foreground", "warning-border", "info", "info-foreground",
  "info-muted", "info-muted-foreground", "info-border",
];

const SCALE_TOKENS = [
  "background", "foreground",
  "accent-1", "accent-2", "accent-3", "accent-4", "accent-5", "accent-6",
  "accent-7", "accent-8", "accent-9", "accent-10", "accent-11", "accent-12",
  "gray-1", "gray-2", "gray-3", "gray-4", "gray-5", "gray-6", "gray-7",
  "gray-8", "gray-9", "gray-10", "gray-11", "gray-12",
  "analogous", "analogous-foreground", "complementary",
  "complementary-foreground", "success", "success-foreground",
  "success-muted", "success-muted-foreground", "success-border", "danger",
  "danger-foreground", "danger-muted", "danger-muted-foreground",
  "danger-border", "warning", "warning-foreground", "warning-muted",
  "warning-muted-foreground", "warning-border", "info", "info-foreground",
  "info-muted", "info-muted-foreground", "info-border",
];

const FORMAT_EXAMPLES = {
  hex: "#f2f2f2",
  rgb: "rgb(242, 242, 242)",
  hsl: "hsl(0, 0%, 95%)",
  "hsl-values": "0 0% 95%",
  oklab: "oklab(96.12% 0 0)",
  oklch: "oklch(96.12% 0 none)",
};

const FORMAT_PATTERNS = {
  hex: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i,
  rgb: /^rgb\(\d+(?:\.\d+)?, \d+(?:\.\d+)?, \d+(?:\.\d+)?\)$/,
  hsl: /^hsl\(-?\d+(?:\.\d+)?, \d+(?:\.\d+)?%, \d+(?:\.\d+)?%\)$/,
  "hsl-values": /^-?\d+(?:\.\d+)? \d+(?:\.\d+)?% \d+(?:\.\d+)?%$/,
  oklab: /^oklab\((?:none|-?\d+(?:\.\d+)?%?) (?:none|-?\d+(?:\.\d+)?) (?:none|-?\d+(?:\.\d+)?)\)$/,
  oklch: /^oklch\((?:none|-?\d+(?:\.\d+)?%?) (?:none|-?\d+(?:\.\d+)?) (?:none|-?\d+(?:\.\d+)?)\)$/,
};

function declarationBlocks(css) {
  const mediaStart = css.indexOf("@media (prefers-color-scheme: dark)");
  const explicitLightStart = css.indexOf('[data-theme="light"]');
  const explicitDarkStart = css.indexOf('[data-theme="dark"]');
  const defaultsStart = css.indexOf("/* Document defaults");
  return [
    css.slice(css.indexOf(":root {"), mediaStart),
    css.slice(mediaStart, explicitLightStart),
    css.slice(explicitLightStart, explicitDarkStart),
    css.slice(explicitDarkStart, defaultsStart),
  ];
}

function declarations(block) {
  return [...block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map((match) => ({
    name: match[1],
    value: match[2],
  }));
}

for (const [preset, expectedNames] of [
  ["shadcn", SHADCN_TOKENS],
  ["radix", SCALE_TOKENS],
  ["css-variables", SCALE_TOKENS],
]) {
  for (const [format, firstValue] of Object.entries(FORMAT_EXAMPLES)) {
    test(`${preset} x ${format} keeps its current four-block declaration contract`, () => {
      const css = generateThemeCss({
        hex: "#4DA0FF",
        preset,
        format,
        scheme: "analogous",
      });
      const blocks = declarationBlocks(css);

      assert.equal(blocks.length, 4);
      for (const block of blocks) {
        assert.deepEqual(declarations(block).map(({ name }) => name), expectedNames);
        for (const { value } of declarations(block)) {
          assert.match(value, FORMAT_PATTERNS[format]);
        }
      }
      assert.equal(declarations(blocks[0])[0].value, firstValue);
      assert.match(css, new RegExp(`Document defaults - written for ${preset} x ${format}`));
    });
  }
}

for (const format of Object.keys(FORMAT_EXAMPLES)) {
  test(`radix and css-variables declarations stay equivalent in ${format}`, () => {
    const options = { hex: "#4DA0FF", format, scheme: "analogous" };
    const radix = declarationBlocks(generateThemeCss({ ...options, preset: "radix" }))
      .map(declarations);
    const cssVariables = declarationBlocks(
      generateThemeCss({ ...options, preset: "css-variables" }),
    ).map(declarations);

    assert.deepEqual(radix, cssVariables);
  });
}
