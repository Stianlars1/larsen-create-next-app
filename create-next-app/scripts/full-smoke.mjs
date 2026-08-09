// @ts-check

import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const smokeScript = join(packageDir, "scripts", "smoke.mjs");

/** @param {string | undefined} tarball */
export function fullSmokeArgs(tarball) {
  if (!tarball) {
    throw new Error("smoke:full requires the tarball path reported by pack:release");
  }
  return [smokeScript, "--full", "--tarball", tarball];
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const result = spawnSync(process.execPath, fullSmokeArgs(process.argv[2]), {
      cwd: packageDir,
      stdio: "inherit",
    });
    if (result.error) throw result.error;
    process.exit(result.status ?? 1);
  } catch (error) {
    console.error(/** @type {Error} */ (error).message);
    process.exit(1);
  }
}
