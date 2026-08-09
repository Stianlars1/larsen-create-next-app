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
    import { checkThemeContrast } from "./scripts/theme-contrast.mjs";
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
        scheme: "monochromatic",
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

test("contrast verification reports every required token that is absent", () => {
  const script = `
    import assert from "node:assert/strict";
    import { checkThemeContrast } from "./scripts/theme-contrast.mjs";
    import { createPaletteMasterFixture } from "./test-support/palette-master.mjs";

    const fixture = await createPaletteMasterFixture();
    try {
      const css = fixture.api.generateThemeCss({
        hex: "#0A0A0A",
        preset: "shadcn",
        format: "hsl-values",
        scheme: "monochromatic",
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
    "../scripts/theme-contrast.mjs"
  );
  assert.equal(CONTRAST_PRESET, "shadcn");
  assert.equal(CONTRAST_FORMAT, "hsl-values");
  assert.deepEqual(CONTRAST_CHECKS, [
    { token: "foreground", against: "background", minimum: 4.5, standard: "WCAG" },
    { token: "card-foreground", against: "card", minimum: 4.5, standard: "WCAG" },
    { token: "popover-foreground", against: "popover", minimum: 4.5, standard: "WCAG" },
    { token: "ring", against: "background", minimum: 3, standard: "WCAG" },
    { token: "primary-foreground", against: "primary", minimum: 4.5, standard: "WCAG" },
    { token: "primary", against: "background", minimum: 1.5, standard: "visibility-floor" },
  ]);
});
