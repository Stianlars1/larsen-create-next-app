// @ts-check

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Returns the generated-document checks shared by the real tarball smoke and
 * its focused contract tests. NEXTJS.md is conditional because it is created
 * only when create-next-app supplied an AGENTS.md for the overlay to preserve.
 *
 * @param {string} appDir
 * @returns {{ ok: boolean, label: string }[]}
 */
export function generatedDocsChecks(appDir) {
  const checks = ["AGENTS.md", "CLAUDE.md", "DESIGN.md", "README.md"].map((file) => ({
    ok: existsSync(join(appDir, file)),
    label: `${file} exists`,
  }));

  const nextJsPath = join(appDir, "NEXTJS.md");
  if (existsSync(nextJsPath)) {
    checks.push({
      ok: readFileSync(nextJsPath, "utf8").trim().length > 0,
      label: "NEXTJS.md preserves non-empty create-next-app guidance",
    });
  }

  return checks;
}
