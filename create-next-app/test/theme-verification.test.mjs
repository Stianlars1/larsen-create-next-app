import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

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
