import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("the full gate forwards the supplied release artifact path unchanged", () => {
  const artifact = "/tmp/release candidates/exact-artifact.tgz";
  const script = `
    import assert from "node:assert/strict";
    import { fullSmokeArgs } from "./scripts/full-smoke.mjs";

    const artifact = ${JSON.stringify(artifact)};
    const args = fullSmokeArgs(artifact);
    assert.deepEqual(args.slice(-3), ["--full", "--tarball", artifact]);
  `;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

test("the full gate refuses to create a different tarball when no path is supplied", () => {
  const result = spawnSync("npm", ["run", "smoke:full"], {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /smoke:full requires the tarball path reported by pack:release/);
});
