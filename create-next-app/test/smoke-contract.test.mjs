import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generatedDocsChecks } from "../scripts/smoke-contract.mjs";

function fixture() {
  const appDir = mkdtempSync(join(tmpdir(), "lu-smoke-contract-"));
  for (const file of ["AGENTS.md", "CLAUDE.md", "DESIGN.md", "README.md"]) {
    writeFileSync(join(appDir, file), `${file} content\n`);
  }
  return {
    appDir,
    cleanup: () => rmSync(appDir, { recursive: true, force: true }),
  };
}

test("the real smoke docs contract accepts an upstream scaffold without AGENTS.md", () => {
  const run = fixture();
  try {
    const checks = generatedDocsChecks(run.appDir);
    assert.deepEqual(checks.filter(({ ok }) => !ok), []);
    assert.equal(checks.some(({ label }) => label === "NEXTJS.md exists"), false);
  } finally {
    run.cleanup();
  }
});

test("the real smoke docs contract validates NEXTJS.md only when it exists", () => {
  const run = fixture();
  try {
    writeFileSync(join(run.appDir, "NEXTJS.md"), "\n");
    assert.deepEqual(
      generatedDocsChecks(run.appDir).filter(({ ok }) => !ok),
      [{ ok: false, label: "NEXTJS.md preserves non-empty create-next-app guidance" }],
    );
  } finally {
    run.cleanup();
  }
});
