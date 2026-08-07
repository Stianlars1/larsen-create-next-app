// @ts-check

/**
 * Syncs the repo-root masters into the publishable package:
 *
 *   _TEMPLATES/CSS/     -> create-next-app/template/src/lib/design-system/
 *   _TEMPLATES/palette/ -> create-next-app/palette/
 *
 * npm can only pack files inside the package folder, so the masters are
 * copied in. Runs automatically via `prepack`; the smoke test asserts the
 * copies are byte-identical to the masters. Never edit the copies.
 */

import { cpSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const pkgDir = join(repoRoot, "create-next-app");

const jobs = [
  {
    name: "CSS master",
    source: join(repoRoot, "CSS"),
    target: join(pkgDir, "template", "src", "lib", "design-system"),
    required: ["index.css", "core.css", "theme.css", "base.css"],
  },
  {
    name: "palette master",
    source: join(repoRoot, "palette"),
    target: join(pkgDir, "palette"),
    required: ["index.js", "NOTICE.md", join("engine", "generatePalette.js")],
  },
];

for (const job of jobs) {
  if (!existsSync(job.source)) {
    console.error(`sync: ${job.name} missing at ${job.source}`);
    process.exit(1);
  }
  for (const rel of job.required) {
    if (!existsSync(join(job.source, rel))) {
      console.error(`sync: ${job.name} is incomplete - missing ${rel}`);
      process.exit(1);
    }
  }
  rmSync(job.target, { recursive: true, force: true });
  cpSync(job.source, job.target, {
    recursive: true,
    filter: (src) => !src.includes("node_modules") && !src.endsWith(".DS_Store"),
  });
  console.log(`sync: ${job.name} -> ${job.target}`);
}
