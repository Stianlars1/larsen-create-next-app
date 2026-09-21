import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { FORMATS, NEUTRAL_TINTS, PRESETS } from "../palette/index.js";
import { OPTION_CONTRACT, renderMarkdownOptionTable } from "../src/options.js";
import { PALETTE_PROMPT_CONTRACT } from "../src/prompts.js";
import {
  ALL_SKILLS,
  RECOMMENDED_SKILLS,
  SELECTABLE_SKILLS,
  SKILL_SOURCES,
  renderSkillsNote,
} from "../src/skills.js";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("skill aliases remain Larsen-only while explicit selection includes transitions-dev", () => {
  assert.deepEqual(RECOMMENDED_SKILLS, [
    "motion-craft",
    "interface-craft",
    "interface-review",
    "ui-primitive-picker",
  ]);
  assert.equal(ALL_SKILLS.length, 9);
  assert.equal(ALL_SKILLS.includes("transitions-dev"), false);
  assert.equal(SELECTABLE_SKILLS.includes("transitions-dev"), true);
});

test("a generated project only credits the sources it actually installed", () => {
  const thirdParty = SKILL_SOURCES.find((source) => source.id === "transitions-dev");
  assert.ok(thirdParty);

  const none = renderSkillsNote([]);
  assert.match(none, /## Skills/);
  assert.match(none, /Larsen Skills by Stian Larsen/);
  // Declining skills must not plant a pointer to somebody else's work.
  assert.doesNotMatch(none, /Transitions\.dev|transitions\.dev|transitions-dev/);

  const larsenOnly = renderSkillsNote(["motion-craft", "interface-craft"]);
  assert.match(larsenOnly, /## Installed skills/);
  assert.match(larsenOnly, /Larsen Skills by Stian Larsen/);
  assert.doesNotMatch(larsenOnly, /Transitions\.dev|transitions\.dev|transitions-dev/);

  const thirdPartyOnly = renderSkillsNote(["transitions-dev"]);
  assert.match(thirdPartyOnly, /Transitions\.dev by Jakub Antalik/);
  assert.match(thirdPartyOnly, new RegExp(thirdParty.termsUrl.replace(/[.]/g, "\\.")));
  assert.doesNotMatch(thirdPartyOnly, /Larsen Skills by Stian Larsen/);

  const mixed = renderSkillsNote(["motion-craft", "transitions-dev"]);
  assert.match(mixed, /Larsen Skills by Stian Larsen/);
  assert.match(mixed, /Transitions\.dev by Jakub Antalik/);
  for (const source of SKILL_SOURCES) {
    assert.match(mixed, new RegExp(source.installCommand.replace(/[.]/g, "\\.")));
  }
});

test("palette option choices follow the public palette API", async () => {
  const { optionChoices } = await import("../src/options.js");
  assert.deepEqual(optionChoices("preset").map(c => c.value), Object.keys(PRESETS));
  assert.deepEqual(optionChoices("format").map(c => c.value), Object.keys(FORMATS));
  assert.deepEqual(optionChoices("neutral-tint").map(c => c.value), NEUTRAL_TINTS);
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

  for (const skill of SELECTABLE_SKILLS) assert.match(generated, new RegExp(`\\b${skill}\\b`));
  for (const skill of RECOMMENDED_SKILLS) {
    assert.match(generated, new RegExp(`Recommended initial selection:[^\n]*${skill}`));
  }
  assert.match(generated, /Recommended/);
  assert.match(generated, /All Larsen Skills/);
  assert.match(generated, /Let me pick/);
  assert.match(generated, /empty selection is allowed/i);
  assert.match(generated, new RegExp(`All Larsen Skills[^\n]*${ALL_SKILLS.length} skills`));
});

test("the palette prompt contract covers the seed and every option requiring it", () => {
  const seedDependent = OPTION_CONTRACT.filter((option) => option.requires === "hex").map(
    (option) => option.name,
  );
  assert.deepEqual(
    PALETTE_PROMPT_CONTRACT.followUps.map((entry) => entry.option),
    ["hex", ...seedDependent],
  );
  assert.equal(PALETTE_PROMPT_CONTRACT.followUps.at(-1)?.option, "neutral-tint");

  const reference = readFileSync(join(packageDir, "..", "docs", "reference", "cli.md"), "utf8");
  assert.match(reference, /HEX seed, preset, format, and neutral tint/);
  assert.match(reference, /Neutral tint is asked last with `weak` preselected/);
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

test("native palette documentation separates audited bytes and consumer styling", () => {
  for (const path of ["../PROJECT.md", "../docs/reference/palette.md", "template/DESIGN.md"]) {
    const text = readFileSync(join(packageDir, path), "utf8");
    assert.match(text, /Tintful/);
    assert.match(text, /theme.audit.json/);
    assert.match(text, /document.css/);
    assert.doesNotMatch(text, /closest valid accent|lightness-inverted|81 color names/);
  }
});
