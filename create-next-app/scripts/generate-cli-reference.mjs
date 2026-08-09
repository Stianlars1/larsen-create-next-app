// @ts-check

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderMarkdownOptionTable } from "../src/options.js";

const BEGIN = "<!-- BEGIN GENERATED CLI REFERENCE -->";
const END = "<!-- END GENERATED CLI REFERENCE -->";
const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));
const check = process.argv.includes("--check");

const readme = readFileSync(readmePath, "utf8");
const start = readme.indexOf(BEGIN);
const end = readme.indexOf(END);

if (start === -1 || end === -1 || end < start) {
  console.error(`README.md must contain ${BEGIN} and ${END}.`);
  process.exit(1);
}

const generated = `${BEGIN}\n${renderMarkdownOptionTable()}\n${END}`;
const current = readme.slice(start, end + END.length);

if (current === generated) {
  console.log("CLI reference is current.");
  process.exit(0);
}

if (check) {
  console.error(
    "CLI reference is stale. Run node scripts/generate-cli-reference.mjs and commit README.md.",
  );
  process.exit(1);
}

const updated = `${readme.slice(0, start)}${generated}${readme.slice(end + END.length)}`;
writeFileSync(readmePath, updated);
console.log("Updated README.md CLI reference.");
