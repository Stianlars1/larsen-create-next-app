// @ts-check

import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { syncMasters } from "./sync.mjs";

const packageDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = join(packageDir, "..");

const RELEASE_STATUS_PATHS = Object.freeze([
  ".",
  ":(exclude)docs/verification/**",
]);

/** @param {string} command @param {string[]} args @param {string} cwd */
function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Resolves the immutable source identity and rejects source changes that can
 * affect package contents, release tooling, tests, or the maintained current
 * contract. Dated files under docs/verification are evidence written after an
 * artifact exists, so they are deliberately outside this cleanliness gate.
 *
 * @param {{ repoRoot: string }} options
 * @returns {string} full HEAD object id
 */
export function releaseSourceHead({ repoRoot: sourceRoot }) {
  const head = run("git", ["rev-parse", "--verify", "HEAD"], sourceRoot).trim();
  if (!/^[0-9a-f]{40,64}$/.test(head)) {
    throw new Error(`git rev-parse did not report a full HEAD object id: ${head}`);
  }

  const status = run(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all", "--", ...RELEASE_STATUS_PATHS],
    sourceRoot,
  ).trim();
  if (status) {
    throw new Error(
      `Release-relevant source is dirty. Commit or remove these changes before packing:\n${status}`,
    );
  }
  return head;
}

/**
 * Builds the consumer artifact from a temporary copy. Repository-only scripts
 * remain available to maintainers but are removed from the packed manifest.
 *
 * @param {{ destination: string }} options
 * @returns {string} absolute tarball path
 */
export function packRelease({ destination }) {
  const gitHead = releaseSourceHead({ repoRoot });
  const destinationPath = resolve(destination);
  mkdirSync(destinationPath, { recursive: true });
  const temporaryRoot = mkdtempSync(join(tmpdir(), "lu-release-pack-"));
  const stagedPackage = join(temporaryRoot, "package");

  try {
    cpSync(packageDir, stagedPackage, {
      recursive: true,
      filter: (source) => {
        const rel = relative(packageDir, source);
        if (rel === "") return true;
        const first = rel.split(sep)[0];
        return first !== "node_modules" && !source.endsWith(".tgz");
      },
    });
    syncMasters({ repoRoot, packageDir: stagedPackage });

    const manifestPath = join(stagedPackage, "package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.gitHead = gitHead;
    delete manifest.scripts;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const output = run(
      "npm",
      ["pack", "--ignore-scripts", "--json", "--pack-destination", destinationPath],
      stagedPackage,
    );
    const packed = JSON.parse(output);
    const filename = packed?.[0]?.filename;
    if (typeof filename !== "string") {
      throw new Error(`npm pack did not report a tarball filename\n${output}`);
    }
    return join(destinationPath, filename);
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const destinationFlag = process.argv.indexOf("--pack-destination");
  const destination = destinationFlag === -1
    ? packageDir
    : process.argv[destinationFlag + 1];
  if (!destination) {
    console.error("pack-release: --pack-destination requires a path");
    process.exit(1);
  }

  try {
    const tarball = packRelease({ destination });
    if (process.argv.includes("--verify")) {
      const verificationOutput = run(
        process.execPath,
        [join(packageDir, "scripts", "smoke.mjs"), "--tarball", tarball],
        packageDir,
      );
      process.stdout.write(verificationOutput);
    }
    console.log(tarball);
  } catch (error) {
    console.error(/** @type {Error} */ (error).message);
    process.exit(1);
  }
}
