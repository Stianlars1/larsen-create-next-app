// @ts-check

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderMarkdownOptionTable } from "../src/options.js";
import { SKILLS_PROMPT_CONTRACT } from "../src/prompts.js";

const OPTION_BEGIN = "<!-- BEGIN GENERATED CLI REFERENCE -->";
const OPTION_END = "<!-- END GENERATED CLI REFERENCE -->";
const SKILLS_BEGIN = "<!-- BEGIN GENERATED SKILLS PROMPT REFERENCE -->";
const SKILLS_END = "<!-- END GENERATED SKILLS PROMPT REFERENCE -->";
const optionReference = `${OPTION_BEGIN}\n${renderMarkdownOptionTable()}\n${OPTION_END}`;

function renderSkillsPromptReference() {
  const { confirmation, selection, picker } = SKILLS_PROMPT_CONTRACT;
  const choices = selection.options
    .map((choice) => `- \`${choice.label}\` (\`${choice.value}\`)${choice.hint ? ` - ${choice.hint}` : ""}`)
    .join("\n");
  const validNames = picker.options.map((skill) => `\`${skill.value}\``).join(", ");
  return [
    `Confirmation: \`${confirmation.message}\``,
    `Interactive default: ${confirmation.initialValue ? "Yes" : "No"}. A No answer installs nothing.`,
    "",
    `A Yes answer opens \`${selection.message}\` with these choices:`,
    "",
    choices,
    "",
    `The initial choice is \`${selection.initialValue}\`. \`Let me pick\` conditionally opens the multiselect:`,
    "",
    `- Prompt: \`${picker.message}\``,
    `- Recommended initial selection: ${picker.initialValues.map((skill) => `\`${skill}\``).join(", ")}`,
    `- The multiselect is ${picker.required ? "required" : "optional; an empty selection is allowed"}.`,
    "",
    `Valid comma-separated names for \`--skills\`: ${validNames}.`,
  ].join("\n");
}

const skillsReference = `${SKILLS_BEGIN}\n${renderSkillsPromptReference()}\n${SKILLS_END}`;
const targets = [
  {
    path: fileURLToPath(new URL("../README.md", import.meta.url)),
    blocks: [[OPTION_BEGIN, OPTION_END, optionReference]],
  },
  {
    path: fileURLToPath(new URL("../../docs/reference/cli.md", import.meta.url)),
    blocks: [
      [OPTION_BEGIN, OPTION_END, optionReference],
      [SKILLS_BEGIN, SKILLS_END, skillsReference],
    ],
  },
];
const check = process.argv.includes("--check");

let changed = false;

for (const target of targets) {
  let document = readFileSync(target.path, "utf8");
  let targetChanged = false;

  for (const [begin, endMarker, generated] of target.blocks) {
    const start = document.indexOf(begin);
    const end = document.indexOf(endMarker);

    if (start === -1 || end === -1 || end < start) {
      console.error(`${target.path} must contain ${begin} and ${endMarker}.`);
      process.exit(1);
    }

    const current = document.slice(start, end + endMarker.length);
    if (current === generated) continue;

    if (check) {
      console.error(
        `CLI reference is stale in ${target.path}. Run node scripts/generate-cli-reference.mjs and commit both references.`,
      );
      process.exit(1);
    }

    document = `${document.slice(0, start)}${generated}${document.slice(end + endMarker.length)}`;
    targetChanged = true;
  }

  if (targetChanged) {
    writeFileSync(target.path, document);
    changed = true;
  }
}

console.log(changed ? "Updated CLI references." : "CLI references are current.");
