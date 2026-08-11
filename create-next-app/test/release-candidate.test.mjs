import assert from "node:assert/strict";
import { existsSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  cleanupReleaseCandidate,
  createDefaultReleaseDestination,
} from "../scripts/pack-release.mjs";

const packageDir = fileURLToPath(new URL("..", import.meta.url));

test("the default release candidate lives in its own temporary directory", () => {
  const destination = createDefaultReleaseDestination();
  try {
    const realDestination = realpathSync(destination);
    const realTemp = realpathSync(tmpdir());
    assert.equal(relative(realTemp, realDestination).startsWith(".."), false);
    assert.match(basename(realDestination), /^lu-release-candidate-/);
    assert.equal(relative(packageDir, realDestination).startsWith(".."), true);
  } finally {
    cleanupReleaseCandidate(join(destination, "candidate.tgz"), { requireArtifact: false });
  }
});

test("cleanup removes only a validated release-candidate root", () => {
  const destination = createDefaultReleaseDestination();
  const artifact = join(destination, "candidate.tgz");
  writeFileSync(artifact, "fixture");

  cleanupReleaseCandidate(artifact);
  assert.equal(existsSync(destination), false);
  assert.throws(
    () => cleanupReleaseCandidate(join(packageDir, "candidate.tgz"), { requireArtifact: false }),
    /refusing to clean unrecognized release candidate/i,
  );
});
