import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("release packing preserves maintainer metadata and removes dead scripts from the artifact", () => {
  const outputDir = mkdtempSync(join(tmpdir(), "lu-pack-test-"));
  const sourceBefore = readFileSync(join(packageDir, "package.json"), "utf8");
  const sourceManifest = JSON.parse(sourceBefore);
  try {
    const result = spawnSync(
      process.execPath,
      ["scripts/pack-release.mjs", "--pack-destination", outputDir],
      {
        cwd: packageDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);

    const tarball = result.stdout.trim().split("\n").at(-1);
    assert.ok(tarball?.startsWith(`${outputDir}/`), result.stdout);
    const manifestResult = spawnSync(
      "tar",
      ["-xOf", tarball, "package/package.json"],
      { encoding: "utf8" },
    );
    assert.equal(manifestResult.status, 0, manifestResult.stderr);
    const manifest = JSON.parse(manifestResult.stdout);
    assert.equal(manifest.scripts, undefined);
    assert.equal(manifest.bin["create-next-app"], "bin/cli.js");
    const entriesResult = spawnSync("tar", ["-tf", tarball], { encoding: "utf8" });
    assert.equal(entriesResult.status, 0, entriesResult.stderr);
    assert.doesNotMatch(entriesResult.stdout, /^package\/(?:scripts|test|test-support)\//m);
    assert.equal(readFileSync(join(packageDir, "package.json"), "utf8"), sourceBefore);
    const artifactStem = sourceManifest.name.replace(/^@/, "").replace("/", "-");
    const expectedName = `${artifactStem}-${sourceManifest.version}.tgz`;
    assert.equal(basename(tarball), expectedName);
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});

test("source-directory publication is refused in favor of the verified tarball", () => {
  const result = spawnSync(process.execPath, ["scripts/refuse-source-publish.mjs"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /Run npm run pack:release, then publish the reported tarball path/);
});
