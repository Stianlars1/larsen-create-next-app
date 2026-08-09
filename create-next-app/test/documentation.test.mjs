import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { FORMATS, PRESETS, SCHEMES } from "../palette/index.js";
import { renderMarkdownOptionTable } from "../src/options.js";
import { ALL_SKILLS, RECOMMENDED_SKILLS } from "../src/skills.js";

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
  assert.match(result.stdout, /CLI references are current/);
});

test("the internal CLI reference matches OPTION_CONTRACT", () => {
  const reference = readFileSync(join(packageDir, "..", "docs", "reference", "cli.md"), "utf8");
  assert.ok(reference.includes(renderMarkdownOptionTable()));
});

test("the internal CLI reference includes the complete runtime skills prompt contract", () => {
  const reference = readFileSync(join(packageDir, "..", "docs", "reference", "cli.md"), "utf8");
  const start = reference.indexOf("<!-- BEGIN GENERATED SKILLS PROMPT REFERENCE -->");
  const end = reference.indexOf("<!-- END GENERATED SKILLS PROMPT REFERENCE -->");
  assert.notEqual(start, -1);
  assert.ok(end > start);
  const generated = reference.slice(start, end);

  for (const skill of ALL_SKILLS) assert.match(generated, new RegExp(`\\b${skill}\\b`));
  for (const skill of RECOMMENDED_SKILLS) {
    assert.match(generated, new RegExp(`Recommended initial selection:[^\n]*${skill}`));
  }
  assert.match(generated, /Recommended/);
  assert.match(generated, /All/);
  assert.match(generated, /Let me pick/);
  assert.match(generated, /empty selection is allowed/i);
});

test("the current authorities explain the Clack and scaffold ownership boundary", () => {
  const project = readFileSync(join(packageDir, "..", "PROJECT.md"), "utf8");
  const cliReference = readFileSync(join(packageDir, "..", "docs", "reference", "cli.md"), "utf8");
  for (const document of [project, cliReference]) {
    const normalized = document.replaceAll(/\s+/g, " ");
    assert.match(normalized, /@clack\/prompts/);
    assert.match(normalized, /prompt UI/i);
    assert.match(normalized, /cancellation/i);
    assert.match(normalized, /intro.*outro/i);
    assert.match(normalized, /logs/i);
    assert.match(normalized, /spinner/i);
    assert.match(normalized, /official create-next-app/i);
    assert.match(normalized, /stdin.*closed/i);
  }
});

test("contrast authorities state the exact supported boundary and thresholds", () => {
  const agents = readFileSync(join(packageDir, "..", "AGENTS.md"), "utf8");
  const project = readFileSync(join(packageDir, "..", "PROJECT.md"), "utf8");
  const paletteReference = readFileSync(
    join(packageDir, "..", "docs", "reference", "palette.md"),
    "utf8",
  );
  for (const document of [agents, project, paletteReference]) {
    const normalized = document.replaceAll(/\s+/g, " ");
    assert.match(normalized, /shadcn.*hsl-values/i);
    assert.match(normalized, /foreground.*background.*4\.5/i);
    assert.match(normalized, /ring.*background.*3(?:\.0)?/i);
    assert.match(normalized, /primary-foreground.*primary.*4\.5/i);
    assert.match(normalized, /primary.*background.*1\.5/i);
    assert.match(normalized, /non-WCAG/i);
    assert.match(normalized, /generator.*before.*serializ/i);
    assert.match(normalized, /Radix.*accent.*4\.5/i);
  }
});
