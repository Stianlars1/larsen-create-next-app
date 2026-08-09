import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { FORMATS, PRESETS, SCHEMES } from "../palette/index.js";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("palette option choices follow the public palette API", async () => {
  PRESETS["test-preset"] = "test-preset";
  FORMATS["test-format"] = "TEST_FORMAT";
  SCHEMES.push("test-scheme");

  try {
    const { optionChoices } = await import(`../src/options.js?palette-test=${Date.now()}`);
    assert.deepEqual(
      optionChoices("preset").map((choice) => choice.value),
      Object.keys(PRESETS),
    );
    assert.deepEqual(
      optionChoices("format").map((choice) => choice.value),
      Object.keys(FORMATS),
    );
    assert.deepEqual(
      optionChoices("scheme").map((choice) => choice.value),
      SCHEMES,
    );
  } finally {
    delete PRESETS["test-preset"];
    delete FORMATS["test-format"];
    SCHEMES.pop();
  }
});

test("the published README CLI reference matches OPTION_CONTRACT", () => {
  const result = spawnSync(process.execPath, ["scripts/generate-cli-reference.mjs", "--check"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /CLI reference is current/);
});
