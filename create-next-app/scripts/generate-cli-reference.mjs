// @ts-check

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderMarkdownOptionTable } from "../src/options.js";

const BEGIN = "<!-- BEGIN GENERATED CLI REFERENCE -->";
const END = "<!-- END GENERATED CLI REFERENCE -->";
const targets = [
  fileURLToPath(new URL("../README.md", import.meta.url)),
  fileURLToPath(new URL("../../docs/reference/cli.md", import.meta.url)),
];
const check = process.argv.includes("--check");

const generated = `${BEGIN}\n${renderMarkdownOptionTable()}\n${END}`;
let changed = false;

for (const target of targets) {
  const document = readFileSync(target, "utf8");
  const start = document.indexOf(BEGIN);
  const end = document.indexOf(END);

  if (start === -1 || end === -1 || end < start) {
    console.error(`${target} must contain ${BEGIN} and ${END}.`);
    process.exit(1);
  }

  const current = document.slice(start, end + END.length);
  if (current === generated) continue;

  if (check) {
    console.error(
      `CLI reference is stale in ${target}. Run node scripts/generate-cli-reference.mjs and commit both references.`,
    );
    process.exit(1);
  }

  const updated = `${document.slice(0, start)}${generated}${document.slice(end + END.length)}`;
  writeFileSync(target, updated);
  changed = true;
}

console.log(changed ? "Updated CLI references." : "CLI references are current.");
