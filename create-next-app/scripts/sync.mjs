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
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = fileURLToPath(new URL("../..", import.meta.url));

/**
 * @param {{ repoRoot?: string, packageDir?: string }} [options]
 */
export function syncMasters({
  repoRoot = defaultRepoRoot,
  packageDir = join(repoRoot, "create-next-app"),
} = {}) {
  const jobs = [
    {
      name: "CSS master",
      source: join(repoRoot, "CSS"),
      target: join(packageDir, "template", "src", "lib", "design-system"),
      required: ["index.css", "core.css", "theme.css", "base.css"],
    },
    {
      name: "palette master",
      source: join(repoRoot, "palette"),
      target: join(packageDir, "palette"),
      required: ["index.js", "NOTICE.md", join("engine", "generatePalette.js")],
    },
  ];

  for (const job of jobs) {
    if (!existsSync(job.source)) {
      throw new Error(`sync: ${job.name} missing at ${job.source}`);
    }
    for (const rel of job.required) {
      if (!existsSync(join(job.source, rel))) {
        throw new Error(`sync: ${job.name} is incomplete - missing ${rel}`);
      }
    }
    rmSync(job.target, { recursive: true, force: true });
    cpSync(job.source, job.target, {
      recursive: true,
      filter: (source) => !source.includes("node_modules") && !source.endsWith(".DS_Store"),
    });
    console.log(`sync: ${job.name} -> ${job.target}`);
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    syncMasters();
  } catch (error) {
    console.error(/** @type {Error} */ (error).message);
    process.exit(1);
  }
}
