import assert from "node:assert/strict";
import Color from "colorjs.io";
import { after, test } from "node:test";
import { createPaletteMasterFixture } from "../test-support/palette-master.mjs";

const fixture = await createPaletteMasterFixture();
after(fixture.cleanup);
const { generateThemeCss } = fixture.api;

const SHADCN_COLOR_TOKENS = [
  "background", "foreground", "foreground-subtle", "card",
  "card-foreground", "popover", "popover-foreground", "primary",
  "primary-foreground", "secondary", "secondary-foreground", "muted",
  "muted-foreground", "accent", "accent-foreground", "destructive",
  "destructive-foreground", "border", "input", "ring", "chart-1",
  "chart-2", "chart-3", "chart-4", "chart-5", "sidebar",
  "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border",
  "sidebar-ring", "analogous", "analogous-foreground", "complementary",
  "complementary-foreground",
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

const SHADCN_LIGHT_TOKENS = SHADCN_COLOR_TOKENS.toSpliced(
  SHADCN_COLOR_TOKENS.indexOf("sidebar"),
  0,
  "radius",
);

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

const RADIX_TOKENS = [
  "background", "foreground", "color-background",
  "accent-1", "accent-2", "accent-3", "accent-4", "accent-5", "accent-6",
  "accent-7", "accent-8", "accent-9", "accent-10", "accent-11", "accent-12",
  "accent-a1", "accent-a2", "accent-a3", "accent-a4", "accent-a5",
  "accent-a6", "accent-a7", "accent-a8", "accent-a9", "accent-a10",
  "accent-a11", "accent-a12", "accent-contrast", "accent-surface",
  "accent-indicator", "accent-track",
  "gray-1", "gray-2", "gray-3", "gray-4", "gray-5", "gray-6", "gray-7",
  "gray-8", "gray-9", "gray-10", "gray-11", "gray-12", "gray-a1",
  "gray-a2", "gray-a3", "gray-a4", "gray-a5", "gray-a6", "gray-a7",
  "gray-a8", "gray-a9", "gray-a10", "gray-a11", "gray-a12",
  "gray-contrast", "gray-surface", "gray-indicator", "gray-track",
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
  hsl: "hsl(0, 0%, 94.902%)",
  "hsl-values": "0 0% 94.902%",
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

const ALPHA_FORMAT_PATTERNS = {
  hex: /^#[0-9a-f]{8}$/i,
  rgb: /^rgba\(\d+(?:\.\d+)?, \d+(?:\.\d+)?, \d+(?:\.\d+)?, 0(?:\.\d+)?\)$/,
  hsl: /^hsla\(-?\d+(?:\.\d+)?, \d+(?:\.\d+)?%, \d+(?:\.\d+)?%, 0(?:\.\d+)?\)$/,
  "hsl-values": /^-?\d+(?:\.\d+)? \d+(?:\.\d+)?% \d+(?:\.\d+)?% \/ 0(?:\.\d+)?$/,
  oklab: /^oklab\((?:none|-?\d+(?:\.\d+)?%?) (?:none|-?\d+(?:\.\d+)?) (?:none|-?\d+(?:\.\d+)?) \/ 0(?:\.\d+)?\)$/,
  oklch: /^oklch\((?:none|-?\d+(?:\.\d+)?%?) (?:none|-?\d+(?:\.\d+)?) (?:none|-?\d+(?:\.\d+)?) \/ 0(?:\.\d+)?\)$/,
};

const ALPHA_OVERRIDE_EXAMPLES = {
  hex: "#1E73C806",
  rgb: "rgba(30, 115, 200, 0.0235)",
  hsl: "hsla(210, 73.913%, 45.098%, 0.0235)",
  "hsl-values": "210 73.913% 45.098% / 0.0235",
  oklab: "oklab(55.21% -0.0451 -0.1462 / 0.0235)",
  oklch: "oklch(55.21% 0.153 252.9 / 0.0235)",
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

function contrastRatio(colorA, colorB) {
  const luminance = (hex) => {
    const compact = hex.replace("#", "");
    const expanded = compact.length === 3
      ? [...compact].map((channel) => channel.repeat(2)).join("")
      : compact;
    const channels = expanded.match(/.{2}/g).map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [lighter, darker] = [luminance(colorA), luminance(colorB)]
    .sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function serializedContrastRatio(colorA, colorB, format) {
  const parse = (value) => new Color(format === "hsl-values" ? `hsl(${value})` : value);
  return parse(colorA).contrastWCAG21(parse(colorB));
}

for (const [preset, lightNames, darkNames = lightNames] of [
  ["shadcn", SHADCN_LIGHT_TOKENS, SHADCN_COLOR_TOKENS],
  ["radix", RADIX_TOKENS],
  ["css-variables", SCALE_TOKENS],
]) {
  for (const [format, firstValue] of Object.entries(FORMAT_EXAMPLES)) {
    test(`${preset} x ${format} matches its desired four-block declaration contract`, () => {
      const css = generateThemeCss({
        hex: "#4DA0FF",
        preset,
        format,
        scheme: "analogous",
      });
      const blocks = declarationBlocks(css);

      assert.equal(blocks.length, 4);
      for (const [index, block] of blocks.entries()) {
        const expectedNames = index % 2 === 0 ? lightNames : darkNames;
        assert.deepEqual(declarations(block).map(({ name }) => name), expectedNames);
        for (const { name, value } of declarations(block)) {
          if (name === "radius") {
            assert.equal(value, "var(--radius-md)");
            continue;
          }
          const patterns = preset === "radix"
            ? [FORMAT_PATTERNS[format], ALPHA_FORMAT_PATTERNS[format]]
            : [FORMAT_PATTERNS[format]];
          assert.ok(
            patterns.some((pattern) => pattern.test(value)),
            `${preset} x ${format} emitted ${name}: ${value}`,
          );
        }
        if (preset === "radix") {
          for (const alphaToken of ["accent-a1", "gray-a1", "accent-surface", "gray-surface"]) {
            const value = declarations(block).find(({ name }) => name === alphaToken)?.value;
            assert.match(value, ALPHA_FORMAT_PATTERNS[format]);
          }
        }
      }
      assert.equal(declarations(blocks[0])[0].value, firstValue);
      assert.match(css, new RegExp(`Document defaults - written for ${preset} x ${format}`));
    });
  }
}

test("shadcn derives its approved token-name contract from palette roles", () => {
  const css = generateThemeCss({
    hex: "#4DA0FF",
    preset: "shadcn",
    format: "hex",
    scheme: "analogous",
  });
  const [lightBlock, darkBlock] = declarationBlocks(css);
  const selected = (block, names) => Object.fromEntries(
    declarations(block)
      .filter(({ name }) => names.includes(name))
      .map(({ name, value }) => [name, value]),
  );
  const names = [
    "card", "card-foreground", "popover", "popover-foreground", "radius",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "sidebar",
    "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground", "sidebar-border",
    "sidebar-ring",
  ];

  assert.deepEqual(selected(lightBlock, names), {
    card: "#f2f2f2",
    "card-foreground": "#1e2022",
    popover: "#f2f2f2",
    "popover-foreground": "#1e2022",
    radius: "var(--radius-md)",
    "chart-1": "#4da0ff",
    "chart-2": "#6560eb",
    "chart-3": "#db8000",
    "chart-4": "#df8f20",
    "chart-5": "#29e075",
    sidebar: "#f2f2f2",
    "sidebar-foreground": "#1e2022",
    "sidebar-primary": "#4DA0FF",
    "sidebar-primary-foreground": "#003071",
    "sidebar-accent": "#d7e3f3",
    "sidebar-accent-foreground": "#003071",
    "sidebar-border": "#b8bbbe",
    "sidebar-ring": "#005bb4",
  });
  assert.deepEqual(selected(darkBlock, names), {
    card: "#18191a",
    "card-foreground": "#edeeef",
    popover: "#212223",
    "popover-foreground": "#edeeef",
    "chart-1": "#4da0ff",
    "chart-2": "#6560eb",
    "chart-3": "#ebaa60",
    "chart-4": "#df8f20",
    "chart-5": "#29e075",
    sidebar: "#18191a",
    "sidebar-foreground": "#edeeef",
    "sidebar-primary": "#4DA0FF",
    "sidebar-primary-foreground": "#08111b",
    "sidebar-accent": "#0e2845",
    "sidebar-accent-foreground": "#cae3ff",
    "sidebar-border": "#46484a",
    "sidebar-ring": "#4DA0FF",
  });
});

for (const format of Object.keys(FORMAT_EXAMPLES)) {
  test(`Radix Themes and CSS Variables declarations are distinct in ${format}`, () => {
    const options = { hex: "#4DA0FF", format, scheme: "analogous" };
    const radix = declarationBlocks(generateThemeCss({ ...options, preset: "radix" }))
      .map(declarations);
    const cssVariables = declarationBlocks(
      generateThemeCss({ ...options, preset: "css-variables" }),
    ).map(declarations);

    assert.notDeepEqual(radix, cssVariables);
  });
}

test("Radix Themes maps its representative contract roles to engine data", () => {
  const css = generateThemeCss({
    hex: "#4DA0FF",
    preset: "radix",
    format: "hex",
    scheme: "analogous",
  });
  const [lightBlock, darkBlock] = declarationBlocks(css);
  const names = [
    "color-background", "accent-a1", "accent-a12", "accent-contrast",
    "accent-surface", "accent-indicator", "accent-track", "gray-a1",
    "gray-a12", "gray-contrast", "gray-surface", "gray-indicator",
    "gray-track",
  ];
  const selected = (block) => Object.fromEntries(
    declarations(block)
      .filter(({ name }) => names.includes(name))
      .map(({ name, value }) => [name, value]),
  );

  assert.deepEqual(selected(lightBlock), {
    "color-background": "#f2f2f2",
    "accent-a1": "#1e73c806",
    "accent-a12": "#003071",
    "accent-contrast": "#003071",
    "accent-surface": "#e2eaf3cc",
    "accent-indicator": "#4da0ff",
    "accent-track": "#4da0ff",
    "gray-a1": "#00000004",
    "gray-a12": "#010306e0",
    "gray-contrast": "#000000",
    "gray-surface": "#ffffffcc",
    "gray-indicator": "#777b7e",
    "gray-track": "#777b7e",
  });
  assert.deepEqual(selected(darkBlock), {
    "color-background": "#101010",
    "accent-a1": "#0026fa0c",
    "accent-a12": "#cae3ff",
    "accent-contrast": "#08111b",
    "accent-surface": "#0f223a80",
    "accent-indicator": "#4da0ff",
    "accent-track": "#4da0ff",
    "gray-a1": "#00109002",
    "gray-a12": "#fdfeffee",
    "gray-contrast": "#FFFFFF",
    "gray-surface": "#0000000d",
    "gray-indicator": "#6b6e71",
    "gray-track": "#6b6e71",
  });
});

test("Radix accent contrast reaches WCAG AA while preserving scale-first foregrounds", () => {
  const seeds = [
    "#262626", "#D8D8D8", "#4DA0FF", "#22C55E", "#F59E0B",
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#EC4899",
  ];

  for (const hex of seeds) {
    const blocks = declarationBlocks(generateThemeCss({
      hex,
      preset: "radix",
      format: "hex",
      scheme: "analogous",
    }));
    for (const [index, block] of blocks.entries()) {
      const values = Object.fromEntries(
        declarations(block).map(({ name, value }) => [name, value]),
      );
      assert.ok(
        contrastRatio(values["accent-contrast"], values["accent-9"]) >= 4.5,
        `${hex} block ${index} emitted ${values["accent-contrast"]} against ${values["accent-9"]}`,
      );
    }
  }

  const brandBlocks = declarationBlocks(generateThemeCss({
    hex: "#4DA0FF",
    preset: "radix",
    format: "hex",
    scheme: "analogous",
  }));
  for (const block of brandBlocks) {
    const values = Object.fromEntries(
      declarations(block).map(({ name, value }) => [name, value]),
    );
    assert.notEqual(values["accent-contrast"].toLowerCase(), "#000000");
    assert.notEqual(values["accent-contrast"].toLowerCase(), "#ffffff");
  }
});

test("every serialized format preserves required foreground contrast", () => {
  const requiredPairs = {
    shadcn: [
      ["foreground", "background"], ["card-foreground", "card"],
      ["popover-foreground", "popover"], ["primary-foreground", "primary"],
      ["secondary-foreground", "secondary"], ["muted-foreground", "muted"],
      ["accent-foreground", "accent"], ["destructive-foreground", "destructive"],
      ["ring", "background", 3], ["primary", "background", 1.5],
    ],
    radix: [
      ["foreground", "background"], ["accent-contrast", "accent-9"],
      ["gray-contrast", "gray-9"],
    ],
    "css-variables": [["foreground", "background"]],
  };
  for (const preset of Object.keys(requiredPairs)) {
    requiredPairs[preset].push(
      ["analogous-foreground", "analogous"],
      ["complementary-foreground", "complementary"],
    );
    for (const name of ["success", "danger", "warning", "info"]) {
      requiredPairs[preset].push(
        [`${name}-foreground`, name],
        [`${name}-muted-foreground`, `${name}-muted`],
      );
    }
  }

  for (const format of Object.keys(FORMAT_EXAMPLES)) {
    for (const preset of Object.keys(requiredPairs)) {
      const blocks = declarationBlocks(generateThemeCss({
        hex: "#D8D8D8",
        preset,
        format,
        scheme: "analogous",
      }));
      for (const [index, block] of blocks.entries()) {
        const values = Object.fromEntries(
          declarations(block).map(({ name, value }) => [name, value]),
        );
        for (const [foreground, background, minimum = 4.5] of requiredPairs[preset]) {
          const actual = serializedContrastRatio(
            values[foreground],
            values[background],
            format,
          );
          assert.ok(
            actual >= minimum,
            `${preset} x ${format} block ${index} emitted ${foreground}/${background} at ${actual.toFixed(4)}`,
          );
        }
      }
    }
  }
});

for (const [format, expected] of Object.entries(ALPHA_OVERRIDE_EXAMPLES)) {
  test(`${format} serialization preserves an eight-digit HEX alpha channel`, () => {
    const css = generateThemeCss({
      hex: "#4DA0FF",
      preset: "shadcn",
      format,
      scheme: "analogous",
      overrides: { background: "#1E73C806" },
    });

    const background = declarations(declarationBlocks(css)[0])
      .find(({ name }) => name === "background");
    assert.equal(background?.value, expected);
  });
}
