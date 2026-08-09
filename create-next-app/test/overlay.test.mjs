import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { overlay } from "../src/overlay.js";

const GLOBALS_CSS = `/* All styling comes from the design system - keep this file as a single import. */
@import "../lib/design-system/index.css";
`;

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "lu-overlay-test-"));
  const templateDir = join(root, "template");
  const appDir = join(root, "app");
  mkdirSync(join(templateDir, "src", "app"), { recursive: true });
  mkdirSync(appDir);
  writeFileSync(join(templateDir, "AGENTS.md"), "Project rules for {{APP_NAME}}.\n");
  writeFileSync(join(templateDir, "src", "app", "globals.css"), GLOBALS_CSS);
  return {
    root,
    templateDir,
    appDir,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("overlay preserves upstream AGENTS.md as NEXTJS.md and writes exact globals.css", () => {
  const run = fixture();
  try {
    writeFileSync(join(run.appDir, "AGENTS.md"), "Upstream Next.js guidance.\n");
    writeFileSync(join(run.appDir, "NEXTJS.md"), "Stale guidance.\n");

    overlay({
      templateDir: run.templateDir,
      appDir: run.appDir,
      vars: { APP_NAME: "fixture-app" },
    });

    assert.equal(readFileSync(join(run.appDir, "NEXTJS.md"), "utf8"), "Upstream Next.js guidance.\n");
    assert.equal(readFileSync(join(run.appDir, "AGENTS.md"), "utf8"), "Project rules for fixture-app.\n");
    assert.equal(readFileSync(join(run.appDir, "src", "app", "globals.css"), "utf8"), GLOBALS_CSS);
  } finally {
    run.cleanup();
  }
});

test("overlay does not invent NEXTJS.md when create-next-app provides no AGENTS.md", () => {
  const run = fixture();
  try {
    overlay({
      templateDir: run.templateDir,
      appDir: run.appDir,
      vars: { APP_NAME: "fixture-app" },
    });

    assert.equal(existsSync(join(run.appDir, "NEXTJS.md")), false);
  } finally {
    run.cleanup();
  }
});
