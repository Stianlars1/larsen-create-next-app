import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import {
  EXPECTED_SEED_HASH,
  buildSweepSeeds,
} from "../scripts/verify-palette-sweep.mjs";

test("the release sweep has a stable 762-seed corpus", () => {
  const { named, random, edge, all } = buildSweepSeeds();
  assert.equal(named.length, 18);
  assert.equal(random.length, 600);
  assert.equal(edge.length, 144);
  assert.equal(all.length, 762);
  assert.equal(new Set(all).size, 762);

  const hash = createHash("sha256").update(all.join("\n")).digest("hex");
  assert.equal(hash, EXPECTED_SEED_HASH);
  assert.equal(hash, "25104d5316f9bdc8804e726842b8f1950b6bc07531aa026013aff4c1669947a9");
});
