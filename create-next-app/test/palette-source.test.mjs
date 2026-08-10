import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("palette tests load an isolated copy of the root master", () => {
  const script = `
    import assert from "node:assert/strict";
    import { createPaletteMasterFixture } from "./test-support/palette-master.mjs";

    const fixture = await createPaletteMasterFixture();
    try {
      assert.ok(fixture.sourceIndex.endsWith("/palette/index.js"));
      assert.ok(!fixture.sourceIndex.includes("/create-next-app/palette/"));
      const css = fixture.api.generateThemeCss({
        hex: "#4DA0FF",
        preset: "shadcn",
        format: "hex",
        neutralTint: "subtle",
      });
      assert.match(css, /Seed: #4DA0FF/);
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
