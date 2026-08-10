import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("the baked default keeps approved aliases aligned after brand overrides", () => {
  const css = readFileSync(join(packageDir, "..", "CSS", "theme.css"), "utf8");
  const declarationMap = (from, to) => {
    const start = css.indexOf(from);
    const end = css.indexOf(to, start);
    return Object.fromEntries(
      [...css.slice(start, end).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)]
        .map((match) => [match[1], match[2]]),
    );
  };
  const light = declarationMap(":root {", "@media");
  const dark = declarationMap("@media", '[data-theme="light"]');

  assert.equal(light.card, light.background);
  assert.equal(light["card-foreground"], light.foreground);
  assert.equal(light.popover, light.background);
  assert.equal(light["popover-foreground"], light.foreground);
  assert.equal(light.sidebar, light.card);
  assert.equal(light["sidebar-foreground"], light.foreground);
  assert.equal(light["sidebar-ring"], light.ring);

  assert.equal(dark["card-foreground"], dark.foreground);
  assert.equal(dark["popover-foreground"], dark.foreground);
  assert.equal(dark.sidebar, dark.card);
  assert.equal(dark["sidebar-foreground"], dark.foreground);
  assert.equal(dark["sidebar-ring"], dark.ring);
});

test("an extreme seed assigns separate mode seeds and passes every contrast check", () => {
  const script = `
    import assert from "node:assert/strict";
    import { checkThemeContrast } from "./src/theme-contrast.mjs";
    import { createPaletteMasterFixture } from "./test-support/palette-master.mjs";

    const fixture = await createPaletteMasterFixture();
    try {
      const { generateThemeCss, seedsForModes } = fixture.api;
      assert.deepEqual(seedsForModes("#0A0A0A"), {
        lightSeed: "#0A0A0A",
        darkSeed: "#F5F5F5",
      });
      const css = generateThemeCss({
        hex: "#0A0A0A",
        preset: "shadcn",
        format: "hsl-values",
        neutralTint: "strong",
      });
      assert.ok(css.includes("Seed: #0A0A0A (light from #0A0A0A, dark from #F5F5F5)"));
      assert.deepEqual(checkThemeContrast(css), []);
    } finally {
      fixture.cleanup();
    }
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test("representative custom seeds pass every generated shadcn contrast check", () => {
  const script = `
    import assert from "node:assert/strict";
    import { checkThemeContrast } from "./src/theme-contrast.mjs";
    import { createPaletteMasterFixture } from "./test-support/palette-master.mjs";

    const seeds = [
      "#0A0A0A", "#262626", "#D8D8D8", "#F5F5F5",
      "#4DA0FF", "#123456", "#ABCDEF",
      "#FF0000", "#22C55E", "#F59E0B",
      "#00FF00", "#0000FF", "#FFFF00", "#00FFFF", "#FF00FF",
      "#EC4899", "#F97316", "#14B8A6",
      // Named HEX shortcuts offered by the companion landing page.
      "#A1A1A1", "#973C00", "#193CB8", "#005F78", "#006045", "#8A0194",
      "#016630", "#372AAC", "#7CCF00", "#9F2D00", "#A3004C", "#6E11B0",
      "#9F0712", "#A50036", "#00598A", "#005F5A", "#5D0EC0", "#EFB100",
    ];
    const neutralTints = ["subtle", "strong"];
    const fixture = await createPaletteMasterFixture();
    try {
      for (const hex of seeds) {
        for (const neutralTint of neutralTints) {
          const css = fixture.api.generateThemeCss({
            hex,
            preset: "shadcn",
            format: "hsl-values",
            neutralTint,
          });
          assert.deepEqual(
            checkThemeContrast(css),
            [],
            \`\${hex} \${neutralTint}\`,
          );
        }
      }
    } finally {
      fixture.cleanup();
    }
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test("contrast verification reports every required token that is absent", () => {
  const script = `
    import assert from "node:assert/strict";
    import { checkThemeContrast } from "./src/theme-contrast.mjs";
    import { createPaletteMasterFixture } from "./test-support/palette-master.mjs";

    const fixture = await createPaletteMasterFixture();
    try {
      const css = fixture.api.generateThemeCss({
        hex: "#0A0A0A",
        preset: "shadcn",
        format: "hsl-values",
        neutralTint: "strong",
      }).replaceAll(/\\n\\s*--ring:[^;]+;/g, "");
      assert.deepEqual(checkThemeContrast(css), [
        "light: missing --ring",
        "dark: missing --ring",
      ]);
    } finally {
      fixture.cleanup();
    }
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test("contrast verification exposes its exact shadcn hsl-values checks", async () => {
  const { CONTRAST_CHECKS, CONTRAST_FORMAT, CONTRAST_PRESET } = await import(
    "../src/theme-contrast.mjs"
  );
  assert.equal(CONTRAST_PRESET, "shadcn");
  assert.equal(CONTRAST_FORMAT, "hsl-values");
  assert.deepEqual(CONTRAST_CHECKS, [
    { token: "foreground", against: "background", minimum: 4.5, standard: "WCAG" },
    { token: "foreground-subtle", against: "background", minimum: 4.5, standard: "WCAG" },
    { token: "card-foreground", against: "card", minimum: 4.5, standard: "WCAG" },
    { token: "popover-foreground", against: "popover", minimum: 4.5, standard: "WCAG" },
    { token: "ring", against: "background", minimum: 3, standard: "WCAG" },
    { token: "input", against: "background", minimum: 3, standard: "WCAG" },
    { token: "input", against: "card", minimum: 3, standard: "WCAG" },
    { token: "input", against: "popover", minimum: 3, standard: "WCAG" },
    { token: "primary-foreground", against: "primary", minimum: 4.5, standard: "WCAG" },
    { token: "primary", against: "background", minimum: 1.5, standard: "visibility-floor" },
  ]);
  // --border is deliberately not here: cards and separators are not user
  // interface components, so SC 1.4.11 does not apply to their outline.
  assert.equal(
    CONTRAST_CHECKS.some((check) => check.token === "border"),
    false,
  );
});

test("contrast verification exposes finite structured measurements for release sweeps", async () => {
  const { CONTRAST_CHECKS, measureThemeContrast } = await import(
    "../src/theme-contrast.mjs"
  );
  const css = readFileSync(join(packageDir, "..", "CSS", "theme.css"), "utf8");
  const result = measureThemeContrast(css);

  assert.deepEqual(result.missing, []);
  assert.equal(result.measurements.length, CONTRAST_CHECKS.length * 2);
  assert.deepEqual(new Set(result.measurements.map(({ mode }) => mode)), new Set(["light", "dark"]));
  for (const measurement of result.measurements) {
    assert.equal(Number.isFinite(measurement.actual), true);
    assert.equal(
      CONTRAST_CHECKS.some(
        ({ token, against, minimum, standard }) =>
          token === measurement.token &&
          against === measurement.against &&
          minimum === measurement.minimum &&
          standard === measurement.standard,
      ),
      true,
    );
  }
});
